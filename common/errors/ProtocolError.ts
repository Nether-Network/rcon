import { RconError } from './RconError';

/**
 * Error thrown when protocol violations occur.
 *
 * Examples:
 * - Malformed packet received
 * - Invalid packet type
 * - Packet parsing failure
 * - Protocol version mismatch
 */
export class ProtocolError extends RconError {
    constructor(message: string, cause?: Error) {
        super(message, cause);
        this.name = 'ProtocolError';

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
