import { validateHost, validatePort, ValidationError } from '@nether-network/rcon-common';

/**
 * Server configuration options (simplified interface for validation).
 */
interface ServerOptions {
    host?: string | null;
    port?: number | null;
    logger?: unknown;
    authHandlers?: unknown[] | null;
    commands?: unknown[] | null;
    addHelpCommand?: boolean | null;
}

/**
 * Validates Server configuration options.
 *
 * Ensures the server can bind to the specified host and port.
 */
export class ServerConfigValidator {
    /**
     * Validates server configuration options.
     *
     * @param options - Server configuration to validate
     * @throws {ValidationError} If any configuration value is invalid
     */
    static validate(options: ServerOptions = {}): void {
        if (typeof options !== 'object' || options === null) {
            throw new ValidationError(
                'Server options must be an object',
                'options',
                options
            );
        }

        // Validate host (optional, defaults to 127.0.0.1)
        if (options.host !== null && options.host !== undefined) {
            validateHost(options.host);
        }

        // Validate port (optional, defaults to 25575)
        if (options.port !== null && options.port !== undefined) {
            validatePort(options.port);

            // Additional check for privileged ports
            if (options.port < 1024) {
                throw new ValidationError(
                    'Port is in privileged range (< 1024). May require elevated permissions.',
                    'port',
                    options.port
                );
            }
        }

        // Validate authHandlers is an array if provided
        if (
            options.authHandlers !== null &&
            options.authHandlers !== undefined
        ) {
            if (!Array.isArray(options.authHandlers)) {
                throw new ValidationError(
                    'Auth handlers must be an array',
                    'authHandlers',
                    options.authHandlers
                );
            }
        }

        // Validate commands is an array if provided
        if (options.commands !== null && options.commands !== undefined) {
            if (!Array.isArray(options.commands)) {
                throw new ValidationError(
                    'Commands must be an array',
                    'commands',
                    options.commands
                );
            }
        }

        // Validate addHelpCommand is boolean if provided
        if (
            options.addHelpCommand !== null &&
            options.addHelpCommand !== undefined
        ) {
            if (typeof options.addHelpCommand !== 'boolean') {
                throw new ValidationError(
                    'addHelpCommand must be a boolean',
                    'addHelpCommand',
                    options.addHelpCommand
                );
            }
        }

        // Logger is optional and can be any value (winston Logger or null)
        // No validation needed as TypeScript handles this
    }
}
