import { ISocket } from './ISocket';
import { ISocketFactory } from './ISocketFactory';
import { TcpSocket } from './TcpSocket';

/**
 * Factory for creating real TCP socket instances.
 *
 * This is the default socket factory used in production,
 * creating real network sockets via Node.js net module.
 */
export class TcpSocketFactory implements ISocketFactory {
    createSocket(): ISocket {
        return new TcpSocket();
    }
}
