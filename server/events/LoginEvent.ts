import { ConnectedClient } from '../ConnectedClient';

/**
 * Emitted when a client completes an authentication attempt.
 */
export interface LoginEvent {
    /** The client that attempted authentication */
    client: ConnectedClient;
    /** Whether the authentication attempt succeeded */
    result: boolean;
    /** The password that was submitted (may be empty string) */
    password: string;
}
