import { EventEmitter } from 'events';
import { RconError } from '@nether-network/rcon-common';

/**
 * Events emitted by RCON clients.
 */
export type ClientEvents = {
    /** Emitted when socket connection is established */
    connected: [];
    /** Emitted when RCON authentication succeeds */
    authenticated: [];
    /** Emitted when connection is closed */
    disconnected: [];
    /** Emitted when an error occurs */
    error: [error: RconError];
};

/**
 * Interface for RCON client implementations.
 *
 * This interface follows the Dependency Inversion Principle (DIP) by
 * allowing consumers (like Proxy) to depend on an abstraction rather
 * than a concrete implementation.
 *
 * Benefits:
 * - Enables dependency injection for better testability
 * - Allows for mock implementations in tests
 * - Supports multiple client implementations (e.g., TLS client)
 * - Decouples consumers from implementation details
 */
export interface IClient extends EventEmitter<ClientEvents> {
    /**
     * Establishes connection to the RCON server and authenticates.
     *
     * @returns Promise that resolves when connected and authenticated
     * @throws {RconError} If connection or authentication fails
     */
    connect(): Promise<void>;

    /**
     * Sends a command to the RCON server.
     *
     * @param command - The command string to execute
     * @returns Promise that resolves with the server's response
     * @throws {RconError} If not connected or authenticated
     */
    send(command: string): Promise<string | null>;

    /**
     * Closes the connection gracefully.
     *
     * @returns Promise that resolves when connection is closed
     */
    close(): Promise<void>;

    /**
     * Checks if the client is currently connected to the server.
     *
     * @returns true if connected, false otherwise
     */
    isConnected(): boolean;

    /**
     * Checks if the client has successfully authenticated.
     *
     * @returns true if authenticated, false otherwise
     */
    isAuthenticated(): boolean;
}
