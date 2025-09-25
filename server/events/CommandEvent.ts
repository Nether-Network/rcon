import { ConnectedClient } from '../ConnectedClient';

/**
 * Emitted when an authenticated client executes a command.
 */
export interface CommandEvent {
    /** The client that sent the command */
    client: ConnectedClient;
    /** The command name as entered by the client */
    command: string;
    /** Arguments that follow the command name */
    args: string[];
}
