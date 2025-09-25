import { RconError } from './RconError';

/**
 * Error thrown when input validation fails.
 *
 * Examples:
 * - Invalid configuration parameters
 * - Invalid host/port format
 * - Out of range values
 * - Missing required fields
 */
export class ValidationError extends RconError {
    /**
     * Creates a new ValidationError.
     *
     * @param message - Human-readable error description
     * @param fieldName - Optional name of the field that failed validation
     * @param value - Optional value that failed validation
     * @param cause - Optional underlying error
     */
    constructor(
        message: string,
        public readonly fieldName?: string,
        public readonly value?: unknown,
        cause?: Error
    ) {
        super(message, cause);
        this.name = 'ValidationError';

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    override toString(): string {
        let result = `${this.name}: ${this.message}`;
        if (this.fieldName) {
            result += ` (field: ${this.fieldName})`;
        }
        if (this.value !== undefined) {
            result += ` (value: ${JSON.stringify(this.value)})`;
        }
        if (this.cause) {
            result += `\nCaused by: ${this.cause.message}`;
        }
        return result;
    }
}
