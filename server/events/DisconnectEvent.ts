import { ConnectedClient } from '../ConnectedClient';

/**
 * Emitted when a client's connection is closed.
 */
export interface DisconnectEvent {
    /** The client that disconnected */
    client: ConnectedClient;
}
