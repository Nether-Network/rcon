import { EventEmitter } from 'events';

/**
 * Events emitted by ISocket.
 */
export type SocketEvents = {
    /** Socket connection established */
    connect: [];

    /** Received data from socket */
    data: [data: Buffer];

    /** Socket closed */
    close: [];

    /** Socket error occurred */
    error: [error: Error];

    /** Socket timeout occurred */
    timeout: [];
};

/**
 * Configuration for socket connection.
 */
export interface SocketConnectOptions {
    host: string;
    port: number;
    timeout?: number;
}

/**
 * Interface for socket abstraction.
 *
 * Provides a testable abstraction over Node.js net.Socket,
 * enabling dependency injection and mocking in tests.
 *
 * This interface defines the minimal socket API needed by
 * the RCON library, focusing on the operations actually used
 * rather than exposing the full net.Socket API.
 */
export interface ISocket extends EventEmitter<SocketEvents> {
    /**
     * Initiates connection to remote host.
     *
     * @param options - Connection parameters
     */
    connect(options: SocketConnectOptions): void;

    /**
     * Writes data to the socket.
     *
     * @param data - Data to write
     * @returns True if data was flushed, false if buffered
     */
    write(data: Buffer): boolean;

    /**
     * Half-closes the socket (graceful shutdown).
     * Sends FIN packet but continues to receive data.
     */
    end(): void;

    /**
     * Immediately destroys the socket.
     * No further I/O activity will occur.
     */
    destroy(): void;

    /**
     * Gets the remote address of the connection.
     * Returns undefined if not connected.
     */
    remoteAddress?: string | undefined;

    /**
     * Gets the remote port of the connection.
     * Returns undefined if not connected.
     */
    remotePort?: number | undefined;

    /**
     * Gets the local address of the connection.
     * Returns undefined if not connected.
     */
    localAddress?: string | undefined;

    /**
     * Gets the local port of the connection.
     * Returns undefined if not connected.
     */
    localPort?: number | undefined;

    /**
     * Checks if the socket is destroyed.
     */
    destroyed: boolean;
}
