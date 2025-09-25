import { EventEmitter } from 'events';
import { RconError } from '@nether-network/rcon-common';
import {
    ListenEvent,
    ConnectionEvent,
    LoginEvent,
    CommandEvent,
    DisconnectEvent,
} from '@nether-network/rcon-server';

/**
 * Events emitted by the RCON proxy, forwarded from the underlying server.
 */
export type ProxyEvents = {
    /** Emitted when the proxy server starts listening for connections */
    listen: [event: ListenEvent];
    /** Emitted when a new RCON client connects to the proxy */
    connection: [event: ConnectionEvent];
    /** Emitted when a client attempts authentication against the proxy */
    login: [event: LoginEvent];
    /** Emitted when an authenticated client executes a command via the proxy */
    command: [event: CommandEvent];
    /** Emitted when a client disconnects from the proxy */
    disconnect: [event: DisconnectEvent];
    /** Emitted when a proxy-level or backend error occurs */
    error: [error: RconError];
};

/**
 * Interface for RCON proxy implementations.
 *
 * This interface follows the Dependency Inversion Principle (DIP) by
 * allowing consumers to depend on an abstraction rather than a concrete
 * implementation.
 *
 * Benefits:
 * - Enables dependency injection for better testability
 * - Allows for mock implementations in tests
 * - Decouples consumers from implementation details
 */
export interface IProxy extends EventEmitter<ProxyEvents> {
    /**
     * Starts the proxy server and connects to all configured backend servers.
     *
     * @returns Promise that resolves when the proxy is ready to accept connections
     * @throws {RconError} If the proxy server cannot bind to the specified host/port
     */
    start(): Promise<void>;
}
