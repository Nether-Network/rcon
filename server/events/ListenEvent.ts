/**
 * Emitted when the server successfully binds and starts listening.
 */
export interface ListenEvent {
    /** The host address the server is bound to */
    host: string;
    /** The port number the server is listening on */
    port: number;
}
