import { EventEmitter } from 'events';
import * as net from 'net';
import { ListenEvent } from './events/ListenEvent';
import { ConnectedClient } from './ConnectedClient';
import { Packet, RconError, ProtocolError, PacketStreamParser, TcpSocket } from '@nether-network/rcon-common';
import { ServerConfigValidator } from './config/ServerConfigValidator';
import { IAuthHandler } from './handler/auth/IAuthHandler';
import { IPacketHandler } from './handler/packet/IPacketHandler';
import { AuthPacketHandler } from './handler/packet/AuthPacketHandler';
import { CommandPacketHandler } from './handler/packet/CommandPacketHandler';
import { NoopAuthHandler } from './handler/auth/NoopAuthHandler';
import { Logger } from 'winston';
import { ICommand } from './command/ICommand';
import { CommandRegistry } from './command/CommandRegistry';
import { HelpCommand } from './command/HelpCommand';
import { IServer, ServerEvents } from './IServer';

/**
 * Generates a unique client ID.
 * Simple counter-based ID generator for client connections.
 */
let clientIdCounter = 0;
function generateClientId(): string {
    return `client-${Date.now()}-${++clientIdCounter}`;
}

export interface ServerOptions {
    host?: string | null;
    port?: number | null;
    logger?: Logger | null;
    authHandlers?: IAuthHandler[] | null;
    commands?: ICommand[] | null;
    addHelpCommand?: boolean | null;
}

/**
 * RCON server that accepts TCP connections and routes packets to registered handlers.
 *
 * Manages client connections, delegates authentication to IAuthHandler implementations,
 * and dispatches commands through the CommandRegistry.
 */
export class Server extends EventEmitter<ServerEvents> implements IServer {
    private readonly host: string;
    private readonly port: number;
    private readonly logger: Logger | null;
    private readonly authHandlers: IAuthHandler[];
    private readonly packetHandlers: IPacketHandler[];
    private readonly commandRegistry: CommandRegistry;

    private server: net.Server | null = null;
    private clients: Map<string, ConnectedClient> = new Map();

    constructor(options: ServerOptions = {}) {
        super();

        // Validate configuration
        ServerConfigValidator.validate(options);

        this.host = options.host || '127.0.0.1';
        this.port = options.port || 25575;
        this.logger = options.logger || null;
        this.authHandlers = options.authHandlers || [new NoopAuthHandler()];
        this.packetHandlers = [
            new AuthPacketHandler(this),
            new CommandPacketHandler(this),
        ];
        this.commandRegistry = new CommandRegistry();
        if (options.commands)
            this.commandRegistry.registerCommand(...options.commands);
        if (options.addHelpCommand ?? true) {
            this.commandRegistry.registerCommand(
                new HelpCommand(this.commandRegistry, '', false)
            );
        }
    }

    /**
     * Starts the RCON server and begins listening for connections.
     *
     * @returns Promise that resolves with the listen event when the server is ready
     * @throws {RconError} If the server cannot bind to the specified host/port
     */
    start(): Promise<ListenEvent> {
        return new Promise((resolve, reject) => {
            this.server = net.createServer(this.handleConnection.bind(this));

            this.server.on('error', (error: Error) => {
                this.logger?.error('Server error', error);
                this.emit('error', new RconError('Server error', error));
                reject(error);
            });

            this.server.listen(this.port, this.host, () => {
                const listenEvent: ListenEvent = {
                    host: this.host,
                    port: this.port,
                };
                this.logger?.info('Server listening', listenEvent);
                this.emit('listen', listenEvent);
                resolve(listenEvent);
            });
        });
    }

    /**
     * Stops the server and closes all active client connections.
     *
     * @returns Promise that resolves when the server has fully stopped
     */
    stop(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.server === null) {
                resolve();
                return;
            }

            // Close all client connections first
            for (const [_id, client] of this.clients) {
                try {
                    client.socket.destroy();
                } catch (error) {
                    // Ignore errors when destroying sockets
                }
            }
            this.clients.clear();

            // Close the server
            this.server.close((err) => {
                this.server = null; // Reset server reference
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }

    private handleConnection(socket: net.Socket): void {
        const id = generateClientId();
        const clientLogger = this.logger?.child({ client: id }) ?? null;

        // Wrap the net.Socket in our ISocket abstraction
        const wrappedSocket = new TcpSocket(socket);

        const client: ConnectedClient = {
            id: id,
            socket: wrappedSocket,
            authenticated: false,
            packetParser: new PacketStreamParser(clientLogger),
            logger: clientLogger,
            extra: {},
        };

        this.clients.set(client.id, client);
        client.logger?.info('Connected');
        this.emit('connection', { client });

        wrappedSocket.on('data', async (data: Buffer) => {
            await this.handleData(client, data);
        });

        wrappedSocket.on('close', () => {
            this.clients.delete(client.id);
            client.logger?.info('Disconnected');
            this.emit('disconnect', { client });
        });

        wrappedSocket.on('error', (error: Error) => {
            this.emit('error', new RconError('Client socket error', error));
            client.logger?.error('Error', error);
            this.clients.delete(client.id);
        });
    }

    private async handleData(client: ConnectedClient, data: Buffer) {
        const packets = client.packetParser.appendData(data);

        for (const packet of packets) {
            await this.handlePacket(client, packet);
        }
    }

    private async handlePacket(client: ConnectedClient, packet: Packet) {
        for (const handler of this.packetHandlers) {
            if (!handler.canHandle(packet)) {
                continue;
            }
            await handler.handle(client, packet);
            return;
        }
        client.logger?.error('Received invalid packet', packet.toString());
        this.emit(
            'error',
            new ProtocolError(`Received invalid packet: ${packet.toString()}`)
        );
    }

    /**
     * Sends a raw packet to a connected client.
     *
     * @param client - The connected client to send the packet to
     * @param packet - The packet to send
     * @returns true if the data was flushed successfully, false if it was queued
     */
    send(client: ConnectedClient, packet: Packet): boolean {
        return client.socket.write(packet.toBuffer());
    }

    /**
     * Runs the registered authentication handlers against the given password.
     *
     * @param password - The password to authenticate
     * @returns Promise that resolves to true if any handler accepts the password
     */
    async authenticate(password: string): Promise<boolean> {
        for (const handler of this.authHandlers) {
            if (await handler.authenticate(password)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Looks up and executes a registered command by name.
     *
     * @param command - The command name to execute
     * @param args - Arguments passed to the command
     * @returns Promise that resolves with the command output, or null
     */
    executeCommand(command: string, args: string[]): Promise<string | null> {
        return this.commandRegistry.executeCommand(command, args);
    }
}
