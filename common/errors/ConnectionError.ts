import { RconError } from './RconError';

/**
 * Error thrown when connection-related failures occur.
 *
 * Examples:
 * - Failed to establish TCP connection
 * - Connection timeout
 * - Connection refused
 * - Network unreachable
 */
export class ConnectionError extends RconError {
    constructor(message: string, cause?: Error) {
        super(message, cause);
        this.name = 'ConnectionError';

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
