/**
 * Base error class for all RCON-related errors.
 *
 * Provides:
 * - Error chaining via 'cause' property
 * - Proper error name for debugging
 * - Stack trace preservation
 */
export class RconError extends Error {
    /**
     * Creates a new RconError.
     *
     * @param message - Human-readable error description
     * @param cause - Optional underlying error that caused this error
     */
    constructor(
        message: string,
        public readonly cause?: Error
    ) {
        super(message);
        this.name = 'RconError';

        // Maintains proper stack trace for where our error was thrown (V8 only)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }

        // Preserve the original error's stack trace if available
        if (cause?.stack) {
            this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
        }
    }

    /**
     * Returns a detailed string representation of the error.
     */
    override toString(): string {
        let result = `${this.name}: ${this.message}`;
        if (this.cause) {
            result += `\nCaused by: ${this.cause.message}`;
        }
        return result;
    }
}
