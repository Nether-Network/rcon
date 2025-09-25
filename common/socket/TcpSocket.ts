import { EventEmitter } from 'events';
import * as net from 'net';
import { ISocket, SocketConnectOptions, SocketEvents } from './ISocket';

/**
 * Wrapper around Node.js net.Socket implementing ISocket interface.
 *
 * This class provides a thin adapter layer between the ISocket
 * abstraction and the native Node.js socket implementation,
 * allowing for dependency injection and testing.
 */
export class TcpSocket extends EventEmitter<SocketEvents> implements ISocket {
    private socket: net.Socket;

    constructor(socket?: net.Socket) {
        super();
        this.socket = socket || new net.Socket();
        this.setupEventForwarding();
    }

    connect(options: SocketConnectOptions): void {
        this.socket.connect({
            host: options.host,
            port: options.port,
        });

        // Set timeout separately if provided
        if (options.timeout !== undefined) {
            this.socket.setTimeout(options.timeout);
        }
    }

    write(data: Buffer): boolean {
        return this.socket.write(data);
    }

    end(): void {
        this.socket.end();
    }

    destroy(): void {
        this.socket.destroy();
    }

    get remoteAddress(): string | undefined {
        return this.socket.remoteAddress;
    }

    get remotePort(): number | undefined {
        return this.socket.remotePort;
    }

    get localAddress(): string | undefined {
        return this.socket.localAddress;
    }

    get localPort(): number | undefined {
        return this.socket.localPort;
    }

    get destroyed(): boolean {
        return this.socket.destroyed;
    }

    /**
     * Gets the underlying net.Socket instance.
     * Used for advanced operations not covered by ISocket interface.
     */
    getUnderlyingSocket(): net.Socket {
        return this.socket;
    }

    /**
     * Sets up event forwarding from net.Socket to ISocket events.
     */
    private setupEventForwarding(): void {
        this.socket.on('connect', () => {
            this.emit('connect');
        });

        this.socket.on('data', (data: Buffer) => {
            this.emit('data', data);
        });

        this.socket.on('close', () => {
            this.emit('close');
        });

        this.socket.on('error', (error: Error) => {
            this.emit('error', error);
        });

        this.socket.on('timeout', () => {
            this.emit('timeout');
        });
    }
}
