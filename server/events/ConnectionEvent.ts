import { ConnectedClient } from '../ConnectedClient';

/**
 * Emitted when a new TCP connection is accepted by the server.
 */
export interface ConnectionEvent {
    /** The newly connected client */
    client: ConnectedClient;
}
