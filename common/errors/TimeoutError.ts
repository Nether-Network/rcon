import { RconError } from './RconError';

/**
 * Error thrown when operations exceed their timeout.
 *
 * Examples:
 * - Connection timeout
 * - Request timeout
 * - Authentication timeout
 */
export class TimeoutError extends RconError {
    /**
     * Creates a new TimeoutError.
     *
     * @param message - Human-readable error description
     * @param timeoutMs - The timeout duration in milliseconds
     * @param cause - Optional underlying error
     */
    constructor(
        message: string,
        public readonly timeoutMs?: number,
        cause?: Error
    ) {
        super(message, cause);
        this.name = 'TimeoutError';

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    override toString(): string {
        let result = `${this.name}: ${this.message}`;
        if (this.timeoutMs !== undefined) {
            result += ` (timeout: ${this.timeoutMs}ms)`;
        }
        if (this.cause) {
            result += `\nCaused by: ${this.cause.message}`;
        }
        return result;
    }
}
