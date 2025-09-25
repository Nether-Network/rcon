import { ClientOptions } from '../Client';
import { validateUri, validateTimeout, ValidationError, Uri, ISocketFactory } from '@nether-network/rcon-common';
import { Logger } from 'winston';

/**
 * Validates Client configuration options.
 *
 * Ensures all required fields are present and valid before
 * attempting to create a connection.
 */
export class ClientConfigValidator {
    /**
     * Validates client configuration options.
     *
     * @param options - Client configuration to validate
     * @throws {ValidationError} If any configuration value is invalid
     */
    static validate(options: ClientOptions | null | undefined): void {
        if (!options) {
            throw new ValidationError(
                'Client options are required',
                'options',
                options
            );
        }

        if (typeof options !== 'object') {
            throw new ValidationError(
                'Client options must be an object',
                'options',
                options
            );
        }

        // Validate URI
        validateUri(options.uri);

        // Validate timeout (optional)
        validateTimeout(options.timeout);

        // Logger is optional and can be any value (winston Logger or null)
        // No validation needed as TypeScript handles this
    }

    /**
     * Validates and applies defaults to client options.
     *
     * @param options - Client configuration
     * @returns Validated options with defaults applied
     */
    static validateAndApplyDefaults(options: ClientOptions): {
        uri: Required<Uri>;
        timeout: number;
        logger: Logger | null;
        socketFactory: ISocketFactory | null;
    } {
        this.validate(options);

        return {
            uri: {
                host: options.uri.host,
                port: options.uri.port ?? 25575,
                password: options.uri.password ?? '',
                tls: options.uri.tls,
            },
            timeout: options.timeout ?? 5000,
            logger: options.logger ?? null,
            socketFactory: options.socketFactory ?? null,
        };
    }
}
