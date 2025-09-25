/**
 * Represents the state of an RCON connection.
 */
export enum ConnectionState {
    /** Not connected */
    DISCONNECTED = 'disconnected',

    /** Attempting to establish connection */
    CONNECTING = 'connecting',

    /** Socket connected, but not authenticated */
    CONNECTED = 'connected',

    /** Connected and authenticated, ready for commands */
    AUTHENTICATED = 'authenticated',

    /** Connection is being closed */
    CLOSING = 'closing',

    /** Connection failed or encountered an error */
    FAILED = 'failed',
}
