import { RconError } from './RconError';

/**
 * Error thrown when authentication fails.
 *
 * Examples:
 * - Invalid password
 * - Authentication packet rejected
 * - Authentication timeout
 */
export class AuthenticationError extends RconError {
    constructor(message: string, cause?: Error) {
        super(message, cause);
        this.name = 'AuthenticationError';

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
