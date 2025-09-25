import { EventEmitter } from 'events';
import { ISocket, SocketConnectOptions, SocketEvents } from './ISocket';

/**
 * Configuration for MockSocket behavior.
 */
export interface MockSocketOptions {
    /** Should connection succeed? */
    shouldConnect?: boolean;

    /** Delay before emitting connect event (ms) */
    connectDelay?: number;

    /** Error to emit on connection attempt */
    connectionError?: Error | undefined;

    /** Should writes succeed? */
    shouldWrite?: boolean;

    /** Data to automatically receive after connection */
    autoReceiveData?: Buffer[];

    /** Delay before auto-receiving data (ms) */
    autoReceiveDelay?: number;
}

/**
 * Mock socket implementation for testing.
 *
 * Simulates socket behavior without requiring actual network I/O.
 * Useful for unit testing components that depend on sockets.
 *
 * Example usage:
 * ```typescript
 * const mockSocket = new MockSocket({
 *   shouldConnect: true,
 *   autoReceiveData: [Buffer.from('test response')]
 * });
 *
 * mockSocket.on('connect', () => {
 *   console.log('Connected!');
 * });
 *
 * mockSocket.connect({ host: 'test', port: 1234 });
 * ```
 */
export class MockSocket extends EventEmitter<SocketEvents> implements ISocket {
    private options: MockSocketOptions;
    private _destroyed = false;
    private _connected = false;
    private writtenData: Buffer[] = [];

    remoteAddress?: string;
    remotePort?: number;
    localAddress?: string;
    localPort?: number;

    constructor(options: MockSocketOptions = {}) {
        super();
        this.options = {
            shouldConnect: options.shouldConnect ?? true,
            connectDelay: options.connectDelay ?? 0,
            connectionError: options.connectionError,
            shouldWrite: options.shouldWrite ?? true,
            autoReceiveData: options.autoReceiveData ?? [],
            autoReceiveDelay: options.autoReceiveDelay ?? 0,
        };
    }

    connect(options: SocketConnectOptions): void {
        if (this._destroyed) {
            this.emit('error', new Error('Cannot connect: socket destroyed'));
            return;
        }

        // Store connection info
        this.remoteAddress = options.host;
        this.remotePort = options.port;
        this.localAddress = '127.0.0.1';
        this.localPort = Math.floor(Math.random() * 60000) + 1024;

        // Simulate async connection
        setTimeout(() => {
            if (this._destroyed) return;

            if (this.options.connectionError) {
                this.emit('error', this.options.connectionError);
                return;
            }

            if (this.options.shouldConnect ?? true) {
                this._connected = true;
                this.emit('connect');

                // Auto-receive data if configured
                if (
                    this.options.autoReceiveData &&
                    this.options.autoReceiveData.length > 0
                ) {
                    setTimeout(() => {
                        if (this._destroyed || !this._connected) return;
                        for (const data of this.options.autoReceiveData!) {
                            this.emit('data', data);
                        }
                    }, this.options.autoReceiveDelay ?? 0);
                }
            } else {
                this.emit('error', new Error('Connection refused'));
            }
        }, this.options.connectDelay ?? 0);
    }

    write(data: Buffer): boolean {
        if (this._destroyed) {
            this.emit('error', new Error('Cannot write: socket destroyed'));
            return false;
        }

        if (!this._connected) {
            this.emit('error', new Error('Cannot write: not connected'));
            return false;
        }

        if (!(this.options.shouldWrite ?? true)) {
            this.emit('error', new Error('Write failed'));
            return false;
        }

        this.writtenData.push(data);
        return true;
    }

    end(): void {
        if (this._destroyed) return;

        this._connected = false;
        // Simulate async close
        setTimeout(() => {
            if (!this._destroyed) {
                this.emit('close');
            }
        }, 0);
    }

    destroy(): void {
        if (this._destroyed) return;

        this._destroyed = true;
        this._connected = false;

        // Emit close event asynchronously
        setTimeout(() => {
            this.emit('close');
        }, 0);
    }

    get destroyed(): boolean {
        return this._destroyed;
    }

    /**
     * Test helper: Gets all data written to this socket.
     */
    getWrittenData(): Buffer[] {
        return [...this.writtenData];
    }

    /**
     * Test helper: Clears the written data buffer.
     */
    clearWrittenData(): void {
        this.writtenData = [];
    }

    /**
     * Test helper: Simulates receiving data from remote.
     */
    simulateReceive(data: Buffer): void {
        if (!this._destroyed && this._connected) {
            this.emit('data', data);
        }
    }

    /**
     * Test helper: Simulates a socket error.
     */
    simulateError(error: Error): void {
        if (!this._destroyed) {
            this.emit('error', error);
        }
    }

    /**
     * Test helper: Simulates a socket timeout.
     */
    simulateTimeout(): void {
        if (!this._destroyed && this._connected) {
            this.emit('timeout');
        }
    }

    /**
     * Test helper: Simulates remote closing the connection.
     */
    simulateRemoteClose(): void {
        if (!this._destroyed) {
            this._connected = false;
            this.emit('close');
        }
    }

    /**
     * Test helper: Checks if socket is connected.
     */
    isConnected(): boolean {
        return this._connected && !this._destroyed;
    }
}
