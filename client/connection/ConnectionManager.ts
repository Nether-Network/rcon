import { EventEmitter } from 'events';
import { Logger } from 'winston';
import { ConnectionError, ISocket, ISocketFactory, TcpSocketFactory } from '@nether-network/rcon-common';
import { ConnectionState } from './ConnectionState';
import {
    IConnectionManager,
    ConnectionManagerEvents,
    ConnectionConfig,
} from './IConnectionManager';

/**
 * Manages the lifecycle of an RCON socket connection.
 *
 * Responsibilities:
 * - Socket creation and connection
 * - Event listener setup
 * - Connection state tracking
 * - Error handling and cleanup
 *
 * Does NOT handle:
 * - Authentication (Client's responsibility)
 * - Packet parsing (PacketStreamParser's responsibility)
 * - Command handling (Client's responsibility)
 */
export class ConnectionManager
    extends EventEmitter<ConnectionManagerEvents>
    implements IConnectionManager
{
    private socket: ISocket | null = null;
    private state: ConnectionState = ConnectionState.DISCONNECTED;
    private readonly logger: Logger | null;
    private readonly socketFactory: ISocketFactory;

    constructor(logger?: Logger | null, socketFactory?: ISocketFactory) {
        super();
        this.logger = logger || null;
        this.socketFactory = socketFactory || new TcpSocketFactory();
    }

    getState(): ConnectionState {
        return this.state;
    }

    isConnected(): boolean {
        return (
            this.state === ConnectionState.CONNECTED ||
            this.state === ConnectionState.AUTHENTICATED
        );
    }

    connect(config: ConnectionConfig): Promise<void> {
        if (this.socket !== null) {
            this.logger?.notice('Already connected, ignoring connect call');
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            this.setState(ConnectionState.CONNECTING);

            this.logger?.info('Connecting', {
                host: config.host,
                port: config.port,
                timeout: config.timeout,
            });

            this.socket = this.socketFactory.createSocket();
            this.socket.connect({
                host: config.host,
                port: config.port,
                timeout: config.timeout,
            });

            this.setupEventListeners(resolve, reject);
        });
    }

    private setupEventListeners(
        resolve: () => void,
        reject: (error: Error) => void
    ): void {
        if (!this.socket) {
            reject(new ConnectionError('Socket not initialized'));
            return;
        }

        let settled = false;

        const safeResolve = () => {
            if (!settled) {
                settled = true;
                resolve();
            }
        };

        const safeReject = (error: Error) => {
            if (!settled) {
                settled = true;
                reject(error);
            }
        };

        this.socket.on('connect', () => {
            this.logger?.info('Socket connected');
            this.setState(ConnectionState.CONNECTED);
            this.emit('connected');
            safeResolve();
        });

        this.socket.on('data', (data: Buffer) => {
            this.emit('data', data);
        });

        this.socket.on('close', () => {
            this.logger?.info('Socket closed');
            this.setState(ConnectionState.DISCONNECTED);
            this.emit('closed');
            this.cleanup();
        });

        this.socket.on('error', (err: Error) => {
            this.logger?.error('Socket error', err);
            this.setState(ConnectionState.FAILED);

            const connectionError = new ConnectionError('Socket error', err);

            // Only emit error event if we're already settled (connected)
            // Otherwise, just reject the connection promise
            if (settled) {
                this.emit('error', connectionError);
            }

            // Destroy the socket to prevent further events
            if (this.socket) {
                this.socket.destroy();
            }

            this.cleanup();
            safeReject(connectionError);
        });
    }

    write(data: Buffer): boolean {
        if (!this.socket) {
            throw new ConnectionError('Cannot write: not connected');
        }

        if (!this.isConnected()) {
            throw new ConnectionError(
                `Cannot write: connection state is ${this.state}`
            );
        }

        return this.socket.write(data);
    }

    close(): Promise<void> {
        return new Promise((resolve) => {
            if (this.socket === null) {
                resolve();
                return;
            }

            this.logger?.info('Closing connection');
            this.setState(ConnectionState.CLOSING);

            this.socket.once('close', () => {
                resolve();
            });

            this.socket.end();
        });
    }

    getSocket(): ISocket | null {
        return this.socket;
    }

    /**
     * Transitions to a new connection state and emits event.
     */
    private setState(newState: ConnectionState): void {
        const oldState = this.state;
        if (oldState !== newState) {
            this.state = newState;
            this.logger?.debug('Connection state changed', {
                from: oldState,
                to: newState,
            });
            this.emit('stateChanged', oldState, newState);
        }
    }

    /**
     * Cleans up resources when connection is closed or fails.
     */
    private cleanup(): void {
        this.socket = null;
    }
}
