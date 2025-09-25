import { EventEmitter } from 'events';
import { ConnectionError, ISocket } from '@nether-network/rcon-common';
import { ConnectionState } from './ConnectionState';

/**
 * Events emitted by ConnectionManager.
 */
export type ConnectionManagerEvents = {
    /** Socket connection established */
    connected: [];

    /** Received data from socket */
    data: [data: Buffer];

    /** Socket closed */
    closed: [];

    /** Socket error occurred */
    error: [error: ConnectionError];

    /** Connection state changed */
    stateChanged: [oldState: ConnectionState, newState: ConnectionState];
};

/**
 * Configuration for ConnectionManager.
 */
export interface ConnectionConfig {
    host: string;
    port: number;
    timeout: number;
}

/**
 * Interface for managing RCON socket connections.
 *
 * Follows Single Responsibility Principle by focusing solely on
 * socket lifecycle management, separate from authentication and
 * command handling.
 */
export interface IConnectionManager
    extends EventEmitter<ConnectionManagerEvents> {
    /**
     * Gets the current connection state.
     */
    getState(): ConnectionState;

    /**
     * Checks if currently connected.
     */
    isConnected(): boolean;

    /**
     * Establishes socket connection.
     *
     * @returns Promise that resolves when connected
     */
    connect(config: ConnectionConfig): Promise<void>;

    /**
     * Writes data to the socket.
     *
     * @param data - Data to write
     * @returns True if data was flushed, false if buffered
     * @throws {ConnectionError} If not connected
     */
    write(data: Buffer): boolean;

    /**
     * Closes the connection gracefully.
     *
     * @returns Promise that resolves when closed
     */
    close(): Promise<void>;

    /**
     * Gets the underlying socket (for advanced use cases).
     * Returns null if not connected.
     */
    getSocket(): ISocket | null;
}
