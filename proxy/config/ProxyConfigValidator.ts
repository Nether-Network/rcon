import {
    validateHost,
    validatePort,
    validateReconnectInterval,
    validateNotEmpty,
    validateServerName,
    ValidationError,
} from '@nether-network/rcon-common';

/**
 * Proxy client configuration (simplified for validation).
 */
interface ClientConfig {
    name: string;
    host: string;
    port: number;
    password?: string;
}

/**
 * Proxy configuration options (simplified for validation).
 */
interface ProxyOptions {
    host?: string | null;
    port?: number | null;
    reconnectInterval?: number | null;
    authHandlers?: unknown[] | null;
    servers: ClientConfig[];
    logger?: unknown;
}

/**
 * Validates Proxy configuration options.
 *
 * Ensures the proxy can connect to backend servers and bind to the specified port.
 */
export class ProxyConfigValidator {
    /**
     * Validates proxy configuration options.
     *
     * @param options - Proxy configuration to validate
     * @throws {ValidationError} If any configuration value is invalid
     */
    static validate(options: ProxyOptions | null | undefined): void {
        if (!options) {
            throw new ValidationError(
                'Proxy options are required',
                'options',
                options
            );
        }

        if (typeof options !== 'object') {
            throw new ValidationError(
                'Proxy options must be an object',
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

        // Validate reconnectInterval (optional)
        validateReconnectInterval(options.reconnectInterval);

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

        // Validate servers array
        if (!options.servers) {
            throw new ValidationError(
                'Servers array is required',
                'servers',
                options.servers
            );
        }

        if (!Array.isArray(options.servers)) {
            throw new ValidationError(
                'Servers must be an array',
                'servers',
                options.servers
            );
        }

        validateNotEmpty(options.servers, 'servers');

        // Validate each server configuration
        options.servers.forEach((server, index) => {
            this.validateServerConfig(server, index);
        });

        // Check for duplicate server names
        this.validateUniqueServerNames(options.servers);
    }

    /**
     * Validates a single server configuration.
     */
    private static validateServerConfig(
        server: ClientConfig,
        index: number
    ): void {
        const prefix = `servers[${index}]`;

        if (!server || typeof server !== 'object') {
            throw new ValidationError(
                `${prefix} must be an object`,
                prefix,
                server
            );
        }

        // Validate name
        try {
            validateServerName(server.name);
        } catch (error) {
            if (error instanceof ValidationError) {
                throw new ValidationError(
                    `${prefix}.name: ${error.message}`,
                    `${prefix}.name`,
                    server.name
                );
            }
            throw error;
        }

        // Validate host
        try {
            validateHost(server.host);
        } catch (error) {
            if (error instanceof ValidationError) {
                throw new ValidationError(
                    `${prefix}.host: ${error.message}`,
                    `${prefix}.host`,
                    server.host
                );
            }
            throw error;
        }

        // Validate port
        try {
            validatePort(server.port, `${prefix}.port`);
        } catch (error) {
            if (error instanceof ValidationError) {
                throw new ValidationError(
                    `${prefix}.port: ${error.message}`,
                    `${prefix}.port`,
                    server.port
                );
            }
            throw error;
        }

        // Validate password (optional string)
        if (server.password !== undefined && server.password !== null) {
            if (typeof server.password !== 'string') {
                throw new ValidationError(
                    `${prefix}.password must be a string`,
                    `${prefix}.password`,
                    server.password
                );
            }
        }
    }

    /**
     * Validates that all server names are unique.
     */
    private static validateUniqueServerNames(servers: ClientConfig[]): void {
        const names = new Set<string>();
        const duplicates: string[] = [];

        servers.forEach((server) => {
            const nameLower = server.name.toLowerCase();
            if (names.has(nameLower)) {
                duplicates.push(server.name);
            }
            names.add(nameLower);
        });

        if (duplicates.length > 0) {
            throw new ValidationError(
                `Duplicate server names found: ${duplicates.join(', ')}`,
                'servers',
                duplicates
            );
        }
    }
}
