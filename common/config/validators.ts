import { ValidationError } from '../errors';
import { Uri } from '../util/UriParser';

/**
 * Configuration validators for RCON components.
 *
 * These validators follow the "fail fast" principle - catching configuration
 * errors early with clear messages rather than failing at runtime.
 */

/**
 * Validates a hostname or IP address.
 */
export function validateHost(host: string | null | undefined): void {
    if (!host) {
        throw new ValidationError(
            'Host is required and cannot be empty',
            'host',
            host
        );
    }

    if (typeof host !== 'string') {
        throw new ValidationError('Host must be a string', 'host', host);
    }

    if (host.trim().length === 0) {
        throw new ValidationError(
            'Host cannot be whitespace only',
            'host',
            host
        );
    }

    // Basic hostname/IP validation
    const validHostPattern = /^[a-zA-Z0-9._-]+$/;
    if (!validHostPattern.test(host)) {
        throw new ValidationError(
            'Host contains invalid characters (allowed: a-z, A-Z, 0-9, ., _, -)',
            'host',
            host
        );
    }

    if (host.length > 253) {
        throw new ValidationError(
            'Host is too long (max 253 characters)',
            'host',
            host
        );
    }
}

/**
 * Validates a port number.
 */
export function validatePort(
    port: number | null | undefined,
    fieldName: string = 'port'
): void {
    if (port === null || port === undefined) {
        // Port can be null/undefined if it will be set to default later
        return;
    }

    if (typeof port !== 'number') {
        throw new ValidationError('Port must be a number', fieldName, port);
    }

    if (!Number.isInteger(port)) {
        throw new ValidationError('Port must be an integer', fieldName, port);
    }

    if (port < 1 || port > 65535) {
        throw new ValidationError(
            'Port must be between 1 and 65535',
            fieldName,
            port
        );
    }
}

/**
 * Validates a timeout value in milliseconds.
 */
export function validateTimeout(timeout: number | null | undefined): void {
    if (timeout === null || timeout === undefined) {
        // Timeout is optional
        return;
    }

    if (typeof timeout !== 'number') {
        throw new ValidationError(
            'Timeout must be a number',
            'timeout',
            timeout
        );
    }

    if (!Number.isInteger(timeout)) {
        throw new ValidationError(
            'Timeout must be an integer (milliseconds)',
            'timeout',
            timeout
        );
    }

    if (timeout < 0) {
        throw new ValidationError(
            'Timeout cannot be negative',
            'timeout',
            timeout
        );
    }

    if (timeout === 0) {
        throw new ValidationError(
            'Timeout cannot be zero (use null for no timeout)',
            'timeout',
            timeout
        );
    }

    // Reasonable upper limit (10 minutes)
    if (timeout > 600000) {
        throw new ValidationError(
            'Timeout is too large (max 600000ms / 10 minutes)',
            'timeout',
            timeout
        );
    }
}

/**
 * Validates a URI object.
 */
export function validateUri(uri: Uri | null | undefined): void {
    if (!uri) {
        throw new ValidationError('URI is required', 'uri', uri);
    }

    if (typeof uri !== 'object') {
        throw new ValidationError('URI must be an object', 'uri', uri);
    }

    validateHost(uri.host);
    validatePort(uri.port, 'uri.port');

    // Password can be null or string
    if (uri.password !== null && typeof uri.password !== 'string') {
        throw new ValidationError(
            'URI password must be a string or null',
            'uri.password',
            uri.password
        );
    }

    // TLS must be boolean
    if (typeof uri.tls !== 'boolean') {
        throw new ValidationError(
            'URI tls flag must be a boolean',
            'uri.tls',
            uri.tls
        );
    }
}

/**
 * Validates a server name.
 */
export function validateServerName(name: string | null | undefined): void {
    if (!name) {
        throw new ValidationError(
            'Server name is required and cannot be empty',
            'name',
            name
        );
    }

    if (typeof name !== 'string') {
        throw new ValidationError('Server name must be a string', 'name', name);
    }

    if (name.trim().length === 0) {
        throw new ValidationError(
            'Server name cannot be whitespace only',
            'name',
            name
        );
    }

    if (name.length > 100) {
        throw new ValidationError(
            'Server name is too long (max 100 characters)',
            'name',
            name
        );
    }

    // Allow alphanumeric, spaces, and common separators
    const validNamePattern = /^[a-zA-Z0-9 _-]+$/;
    if (!validNamePattern.test(name)) {
        throw new ValidationError(
            'Server name contains invalid characters (allowed: a-z, A-Z, 0-9, space, _, -)',
            'name',
            name
        );
    }
}

/**
 * Validates a reconnection interval.
 */
export function validateReconnectInterval(
    interval: number | null | undefined
): void {
    if (interval === null || interval === undefined) {
        // Optional, will use default
        return;
    }

    if (typeof interval !== 'number') {
        throw new ValidationError(
            'Reconnect interval must be a number',
            'reconnectInterval',
            interval
        );
    }

    if (!Number.isInteger(interval)) {
        throw new ValidationError(
            'Reconnect interval must be an integer (milliseconds)',
            'reconnectInterval',
            interval
        );
    }

    if (interval < 0) {
        throw new ValidationError(
            'Reconnect interval cannot be negative',
            'reconnectInterval',
            interval
        );
    }

    if (interval < 100) {
        throw new ValidationError(
            'Reconnect interval is too short (min 100ms)',
            'reconnectInterval',
            interval
        );
    }

    // Max 5 minutes between reconnects
    if (interval > 300000) {
        throw new ValidationError(
            'Reconnect interval is too large (max 300000ms / 5 minutes)',
            'reconnectInterval',
            interval
        );
    }
}

/**
 * Validates an array is not empty.
 */
export function validateNotEmpty<T>(
    array: T[] | null | undefined,
    fieldName: string
): void {
    if (!array || array.length === 0) {
        throw new ValidationError(
            `${fieldName} cannot be empty`,
            fieldName,
            array
        );
    }
}
