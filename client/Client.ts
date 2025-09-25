import { EventEmitter } from 'events';
import {
    Packet,
    PacketType,
    Uri,
    PacketStreamParser,
    RconError,
    ConnectionError,
    AuthenticationError,
    ISocketFactory,
} from '@nether-network/rcon-common';
import { IClient, ClientEvents } from './IClient';
import { ClientConfigValidator } from './config/ClientConfigValidator';
import { ConnectionManager } from './connection';

interface PendingRequest {
    resolve: (response: string | null) => void;
    reject: (error: RconError) => void;
}

export interface ClientOptions {
    uri: Uri; // ToDo: tls, implement at later point
    timeout?: number | null;
    logger?: import('winston').Logger | null;
    socketFactory?: ISocketFactory | null; // For testing - inject mock socket factory
}

export class Client extends EventEmitter<ClientEvents> implements IClient {
    private readonly uri: Uri;
    private readonly timeout: number;
    private readonly logger: import('winston').Logger | null;

    private readonly connectionManager: ConnectionManager;
    private readonly packetParser: PacketStreamParser;
    private authenticated = false;
    private nextRequestId: number = 1;
    private pendingRequests: Map<number, PendingRequest> = new Map();

    constructor(options: ClientOptions) {
        super();

        // Validate and apply defaults
        const validatedOptions =
            ClientConfigValidator.validateAndApplyDefaults(options);

        this.uri = validatedOptions.uri;
        this.timeout = validatedOptions.timeout;
        this.logger = validatedOptions.logger;
        this.connectionManager = new ConnectionManager(
            this.logger,
            validatedOptions.socketFactory || undefined
        );
        this.packetParser = new PacketStreamParser(this.logger);

        this.setupConnectionListeners();
    }

    isConnected(): boolean {
        return this.connectionManager.isConnected();
    }

    isAuthenticated(): boolean {
        return this.authenticated;
    }

    connect(): Promise<void> {
        if (this.connectionManager.isConnected()) {
            this.logger?.notice('Ignoring connect call, already connected');
            return Promise.resolve();
        }

        return this.connectionManager
            .connect({
                host: this.uri.host,
                port: this.uri.port as number,
                timeout: this.timeout,
            })
            .then(() => {
                return this.authenticate();
            })
            .then(() => {
                this.emit('authenticated');
            })
            .catch((err) => {
                return this.close()
                    .then(() => {
                        this.destroy();
                    })
                    .finally(() => {
                        throw err;
                    });
            });
    }

    private authenticate(): Promise<void> {
        if (this.authenticated) {
            this.logger?.notice(
                'Ignoring authenticate call, already authenticated'
            );
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            this.logger?.debug('Trying to authenticate');
            const requestId = this.nextRequestId++;
            // gets a real requestId, but always saved as -1
            this.pendingRequests.set(-1, {
                resolve: (_) => resolve(),
                reject,
            });
            this.sendPacket(
                new Packet(requestId, PacketType.AUTH, this.uri.password)
            );
        });
    }

    send(command: string): Promise<string | null> {
        if (!this.connectionManager.isConnected()) {
            this.logger?.warning('Tried sending command when not connected', {
                command,
            });
            return Promise.reject(new ConnectionError('Not connected'));
        }
        if (!this.authenticated) {
            this.logger?.warning(
                'Tried sending command when not authenticated',
                { command }
            );
            return Promise.reject(new AuthenticationError('Not authenticated'));
        }

        return new Promise((resolve, reject) => {
            this.logger?.info('Sending command', { command });
            const requestId = this.nextRequestId++;
            this.pendingRequests.set(requestId, { resolve, reject });
            this.sendPacket(
                new Packet(requestId, PacketType.EXECCOMMAND, command)
            );
        });
    }

    private sendPacket(packet: Packet): void {
        this.connectionManager.write(packet.toBuffer());
    }

    /**
     * Sets up event listeners for connection manager events.
     */
    private setupConnectionListeners(): void {
        this.connectionManager.on('connected', () => {
            this.emit('connected');
        });

        this.connectionManager.on('data', async (data: Buffer) => {
            await this.handleData(data);
        });

        this.connectionManager.on('closed', () => {
            this.emit('disconnected');
            this.destroy();
        });

        this.connectionManager.on('error', (error: ConnectionError) => {
            this.emit('error', error);
        });
    }

    private async handleData(data: Buffer) {
        const packets = this.packetParser.appendData(data);

        for (const packet of packets) {
            await this.handlePacket(packet);
        }
    }

    private async handlePacket(packet: Packet): Promise<void> {
        if (packet.type === PacketType.AUTH_RESPONSE) {
            // special case "-1" is auth failure
            const result = packet.id !== -1;
            result
                ? this.logger?.info('Authentication successful')
                : this.logger?.error('Authentication failed');
            const request = this.pendingRequests.get(-1);
            request && this.pendingRequests.delete(-1);
            this.authenticated = result;
            result
                ? request?.resolve(packet.data)
                : request?.reject(
                      new AuthenticationError('Authentication failed')
                  );
            return;
        }

        const request = this.pendingRequests.get(packet.id);
        if (!request) {
            // ignore unknown responses
            this.logger?.warning('Unexpected response packet', { packet });
            return;
        }

        this.pendingRequests.delete(packet.id);

        switch (packet.type) {
            case PacketType.RESPONSE_VALUE:
                this.logger?.debug('Received command response', {
                    response: packet.data,
                });
                request.resolve(packet.data);
                break;
            default:
                this.logger?.error('Unknown packet type', packet);
        }
    }

    close(): Promise<void> {
        return this.connectionManager.close();
    }

    private destroy(): void {
        this.logger?.debug('Destroying client state');
        this.packetParser.reset();
        this.authenticated = false;
        this.nextRequestId = 1;
        this.pendingRequests.clear();
    }
}
