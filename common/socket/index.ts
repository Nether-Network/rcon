/**
 * Socket abstraction module.
 *
 * Provides testable socket abstractions, enabling dependency
 * injection and mocking in tests without requiring real network I/O.
 */

export { ISocket, SocketEvents, SocketConnectOptions } from './ISocket';
export { TcpSocket } from './TcpSocket';
export { MockSocket, MockSocketOptions } from './MockSocket';
export { ISocketFactory } from './ISocketFactory';
export { TcpSocketFactory } from './TcpSocketFactory';
export { MockSocketFactory } from './MockSocketFactory';
