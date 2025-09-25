import { ISocket } from './ISocket';

/**
 * Factory interface for creating socket instances.
 *
 * Enables dependency injection of socket creation,
 * allowing different socket implementations (real, mock, etc.)
 * to be used in different contexts.
 */
export interface ISocketFactory {
    /**
     * Creates a new socket instance.
     *
     * @returns A new socket instance
     */
    createSocket(): ISocket;
}
