import { EventEmitter } from 'events';
import { Logger } from 'winston';
import { IAuthHandler, NoopAuthHandler, Server } from '@nether-network/rcon-server';
import { IClient, Client } from '@nether-network/rcon-client';
import { ProxyPassCommand } from './command/ProxyPassCommand';
import { StatusCommand } from './command/StatusCommand';
import { UseCommand } from './command/UseCommand';
import { ProxyConfigValidator } from './config/ProxyConfigValidator';
import { IProxy, ProxyEvents } from './IProxy';

/**
 * Connection configuration for a single backend RCON server.
 */
export interface ClientConfig {
    /** Logical name used to select this server (must be unique across the proxy) */
    name: string;
    /** Hostname or IP address of the backend RCON server */
    host: string;
    /** Port number of the backend RCON server */
    port: number;
    /** Optional RCON password for the backend server */
    password?: string;
}

/**
 * Runtime state for a managed backend connection.
 * Held in the Proxy's internal client list.
 */
export interface ClientInfo {
    /** The logical name matching the ClientConfig */
    name: string;
    /** Whether this server is currently the active target for forwarded commands */
    selected: boolean;
    /** The underlying IClient connection to the backend server */
    client: IClient;
}

export interface ProxyOptions {
    host?: string | null;
    port?: number | null;
    reconnectInterval?: number | null;
    authHandlers?: IAuthHandler[] | null;
    servers: ClientConfig[];
    logger?: Logger | null;
}

/**
 * RCON proxy that exposes a single RCON endpoint and forwards commands to
 * one of several configured backend servers.
 *
 * Manages reconnection to backends automatically and forwards all server
 * lifecycle events to proxy consumers.
 */
export class Proxy extends EventEmitter<ProxyEvents> implements IProxy {
    private readonly host: string;
    private readonly port: number;
    private readonly reconnectInterval: number;
    private readonly authHandlers: IAuthHandler[];
    private readonly logger: Logger | null;

    private clients: ClientInfo[] = [];
    private server: Server;

    constructor(options: ProxyOptions) {
        super();

        // Validate configuration
        ProxyConfigValidator.validate(options);

        this.host = options.host || '127.0.0.1';
        this.port = options.port || 25575;
        this.reconnectInterval = options.reconnectInterval || 5000;
        this.authHandlers = options.authHandlers || [new NoopAuthHandler()];
        this.logger = options.logger || null;

        for (const config of options.servers) {
            const clientLogger =
                this.logger?.child({ server: config.name }) || null;
            const client = new Client({
                uri: {
                    host: config.host,
                    port: config.port,
                    password: config.password || null,
                    tls: false,
                },
                logger: clientLogger,
            });
            client.on('disconnected', () => {
                clientLogger?.warn(
                    `Disconnected from server, reconnecting in ${this.reconnectInterval}ms`
                );
                setTimeout(() => {
                    client.connect();
                }, this.reconnectInterval);
            });
            client.on('error', (err: Error) => {
                clientLogger?.error(`Client error: ${err.message}`);
            });
            this.clients.push({
                name: config.name,
                selected: false,
                client,
            });
        }

        this.server = new Server({
            host: this.host,
            port: this.port,
            authHandlers: this.authHandlers,
            logger: this.logger,
            commands: [
                new StatusCommand(this.clients),
                new UseCommand(this.clients),
                new ProxyPassCommand(this.clients),
            ],
        });

        // Forward all server lifecycle events so proxy consumers can observe them
        this.server.on('listen',     (event) => this.emit('listen', event));
        this.server.on('connection', (event) => this.emit('connection', event));
        this.server.on('login',      (event) => this.emit('login', event));
        this.server.on('command',    (event) => this.emit('command', event));
        this.server.on('disconnect', (event) => this.emit('disconnect', event));
        this.server.on('error',      (error) => this.emit('error', error));
    }

    /**
     * Starts the proxy server and connects to all configured backend servers.
     *
     * @returns Promise that resolves when the proxy is ready to accept connections
     * @throws {RconError} If the proxy server cannot bind to the specified host/port
     */
    async start(): Promise<void> {
        await this.server.start();
        for (const { client } of this.clients) {
            client.connect();
        }
    }
}
