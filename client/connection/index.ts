/**
 * Connection management module.
 *
 * Provides abstraction for socket lifecycle management,
 * separating connection concerns from authentication and
 * command handling.
 */

export { ConnectionState } from './ConnectionState';
export {
    IConnectionManager,
    ConnectionManagerEvents,
    ConnectionConfig,
} from './IConnectionManager';
export { ConnectionManager } from './ConnectionManager';
