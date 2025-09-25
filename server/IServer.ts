import { EventEmitter } from 'events';
import { Packet, RconError } from '@nether-network/rcon-common';
import { ConnectedClient } from './ConnectedClient';
import { ListenEvent } from './events/ListenEvent';
import { ConnectionEvent } from './events/ConnectionEvent';
import { LoginEvent } from './events/LoginEvent';
import { CommandEvent } from './events/CommandEvent';
import { DisconnectEvent } from './events/DisconnectEvent';

/**
 * Events emitted by RCON servers.
 */
export type ServerEvents = {
    /** Emitted when the server starts listening for connections */
    listen: [event: ListenEvent];
    /** Emitted when a new client connects */
    connection: [event: ConnectionEvent];
    /** Emitted when a client attempts authentication */
    login: [event: LoginEvent];
    /** Emitted when an authenticated client executes a command */
    command: [event: CommandEvent];
    /** Emitted when a client disconnects */
    disconnect: [event: DisconnectEvent];
    /** Emitted when a server-level or client-socket error occurs */
    error: [error: RconError];
};

/**
 * Interface for RCON server implementations.
 *
 * This interface follows the Dependency Inversion Principle (DIP) by
 * allowing consumers (like Proxy) to depend on an abstraction rather
 * than a concrete implementation.
 *
 * Benefits:
 * - Enables dependency injection for better testability
 * - Allows for mock implementations in tests
 * - Supports multiple server implementations (e.g. TLS server)
 * - Decouples consumers from implementation details
 */
export interface IServer extends EventEmitter<ServerEvents> {
    /**
     * Starts the RCON server and begins listening for connections.
     *
     * @returns Promise that resolves with the listen event when the server is ready
     * @throws {RconError} If the server cannot bind to the specified host/port
     */
    start(): Promise<ListenEvent>;

    /**
     * Stops the server and closes all active client connections.
     *
     * @returns Promise that resolves when the server has fully stopped
     */
    stop(): Promise<void>;

    /**
     * Sends a raw packet to a connected client.
     *
     * @param client - The connected client to send the packet to
     * @param packet - The packet to send
     * @returns true if the data was flushed successfully, false if it was queued
     */
    send(client: ConnectedClient, packet: Packet): boolean;

    /**
     * Runs the registered authentication handlers against the given password.
     *
     * @param password - The password to authenticate
     * @returns Promise that resolves to true if any handler accepts the password
     */
    authenticate(password: string): Promise<boolean>;

    /**
     * Looks up and executes a registered command by name.
     *
     * @param command - The command name to execute
     * @param args - Arguments passed to the command
     * @returns Promise that resolves with the command output, or null
     */
    executeCommand(command: string, args: string[]): Promise<string | null>;
}
