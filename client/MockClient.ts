import { EventEmitter } from 'events';
import { IClient, ClientEvents } from './IClient';
import {
    RconError,
    ConnectionError,
    AuthenticationError,
} from '@nether-network/rcon-common';

/**
 * Mock RCON client for testing purposes.
 *
 * This demonstrates the benefit of the IClient interface - we can create
 * mock implementations without any actual network connections.
 *
 * Useful for:
 * - Unit testing code that depends on IClient
 * - Integration testing without real servers
 * - Simulating various connection states and errors
 */
export class MockClient extends EventEmitter<ClientEvents> implements IClient {
    private _connected: boolean = false;
    private _authenticated: boolean = false;
    private commandResponses: Map<string, string | null> = new Map();

    /**
     * Configures a response for a specific command.
     * Useful for testing expected command/response flows.
     */
    setCommandResponse(command: string, response: string | null): void {
        this.commandResponses.set(command, response);
    }

    /**
     * Simulates a connection without actual network I/O.
     */
    async connect(): Promise<void> {
        if (this._connected) {
            return;
        }

        // Simulate async connection
        await new Promise((resolve) => setTimeout(resolve, 10));

        this._connected = true;
        this.emit('connected');

        this._authenticated = true;
        this.emit('authenticated');
    }

    /**
     * Simulates sending a command and returns configured response.
     */
    async send(command: string): Promise<string | null> {
        if (!this._connected) {
            throw new ConnectionError('Not connected');
        }

        if (!this._authenticated) {
            throw new AuthenticationError('Not authenticated');
        }

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 5));

        const response = this.commandResponses.get(command);
        if (response !== undefined) {
            return response;
        }

        // Default response
        return `Mock response for: ${command}`;
    }

    /**
     * Simulates closing the connection.
     */
    async close(): Promise<void> {
        if (!this._connected) {
            return;
        }

        // Simulate async close
        await new Promise((resolve) => setTimeout(resolve, 10));

        this._connected = false;
        this._authenticated = false;
        this.emit('disconnected');
    }

    isConnected(): boolean {
        return this._connected;
    }

    isAuthenticated(): boolean {
        return this._authenticated;
    }

    /**
     * Test helper: Simulate a connection error.
     */
    simulateError(message: string): void {
        const error = new RconError(message);
        this.emit('error', error);
    }

    /**
     * Test helper: Simulate disconnection.
     */
    simulateDisconnect(): void {
        this._connected = false;
        this._authenticated = false;
        this.emit('disconnected');
    }
}
