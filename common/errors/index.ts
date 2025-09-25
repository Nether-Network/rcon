/**
 * RCON Error Types
 *
 * This module provides a hierarchy of error types for better error handling
 * and debugging. All errors extend the base RconError class.
 *
 * Benefits:
 * - Specific error types enable targeted error handling
 * - Better error messages with context
 * - Proper stack trace preservation
 * - Error chaining for root cause analysis
 *
 * Usage:
 * ```typescript
 * try {
 *     await client.connect();
 * } catch (error) {
 *     if (error instanceof AuthenticationError) {
 *         console.error('Invalid password');
 *     } else if (error instanceof ConnectionError) {
 *         console.error('Cannot reach server');
 *     }
 * }
 * ```
 */

export { RconError } from './RconError';
export { ConnectionError } from './ConnectionError';
export { AuthenticationError } from './AuthenticationError';
export { ProtocolError } from './ProtocolError';
export { TimeoutError } from './TimeoutError';
export { ValidationError } from './ValidationError';
