import { ISocket } from './ISocket';
import { ISocketFactory } from './ISocketFactory';
import { MockSocket, MockSocketOptions } from './MockSocket';

/**
 * Factory for creating mock socket instances for testing.
 *
 * Allows configuring mock socket behavior that will apply
 * to all sockets created by this factory.
 */
export class MockSocketFactory implements ISocketFactory {
    constructor(private options: MockSocketOptions = {}) {}

    createSocket(): ISocket {
        return new MockSocket(this.options);
    }

    /**
     * Updates the options for subsequently created sockets.
     */
    setOptions(options: MockSocketOptions): void {
        this.options = options;
    }
}
