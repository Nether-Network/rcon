// Integration tests — requires real TCP
// boxen uses ESM — mock it to avoid transform issues in Jest
jest.mock('boxen', () => (text: string) => text);

import * as net from 'net';
import { Server } from './Server';
import { Packet, PacketType } from '@nether-network/rcon-common';
import { PasswordAuthHandler } from './handler/auth/PasswordAuthHandler';

jest.setTimeout(10000);

function getFreePort(): Promise<number> {
    return new Promise((resolve) => {
        const tmp = net.createServer();
        tmp.listen(0, '127.0.0.1', () => {
            const port = (tmp.address() as net.AddressInfo).port;
            tmp.close(() => resolve(port));
        });
    });
}

function connectRawClient(port: number): Promise<net.Socket> {
    return new Promise((resolve, reject) => {
        const socket = net.connect({ host: '127.0.0.1', port });
        socket.once('connect', () => resolve(socket));
        socket.once('error', reject);
    });
}

function sendPacket(socket: net.Socket, packet: Packet): void {
    socket.write(packet.toBuffer());
}

function receivePacket(socket: net.Socket): Promise<Packet> {
    return new Promise((resolve, reject) => {
        let buf = Buffer.alloc(0);
        function onData(chunk: Buffer) {
            buf = Buffer.concat([buf, chunk]);
            if (buf.length < 4) return;
            const frameLength = buf.readInt32LE(0);
            if (buf.length < frameLength + 4) return;
            socket.off('data', onData);
            socket.off('error', onError);
            try {
                resolve(Packet.fromBuffer(buf.slice(4)));
            } catch (err) {
                reject(err);
            }
        }
        function onError(err: Error) {
            socket.off('data', onData);
            socket.off('error', onError);
            reject(err);
        }
        socket.on('data', onData);
        socket.on('error', onError);
    });
}

async function authenticateClient(
    socket: net.Socket,
    password: string = ''
): Promise<Packet> {
    sendPacket(socket, new Packet(1, PacketType.AUTH, password));
    return receivePacket(socket);
}

describe('Server', () => {
    let server: Server;
    let rawSockets: net.Socket[] = [];
    let serverPort: number;

    async function startServer(options: ConstructorParameters<typeof Server>[0] = {}): Promise<void> {
        const port = await getFreePort();
        server = new Server({ port, host: '127.0.0.1', logger: null, ...options });
        const event = await server.start();
        serverPort = event.port;
    }

    afterEach(async () => {
        for (const sock of rawSockets) {
            sock.destroy();
        }
        rawSockets = [];
        if (server) {
            await server.stop();
        }
    });

    describe('start() / stop()', () => {
        it('should resolve with ListenEvent containing host and port', async () => {
            const port = await getFreePort();
            server = new Server({ port, host: '127.0.0.1', logger: null });
            const event = await server.start();
            serverPort = event.port;
            expect(event.host).toBe('127.0.0.1');
            expect(event.port).toBe(port);
        });

        it('should emit "listen" event with host and port', async () => {
            const port = await getFreePort();
            server = new Server({ port, host: '127.0.0.1', logger: null });
            const spy = jest.fn();
            server.on('listen', spy);
            const event = await server.start();
            serverPort = event.port;
            expect(spy).toHaveBeenCalledWith(expect.objectContaining({ host: '127.0.0.1' }));
        });

        it('should resolve stop() without error', async () => {
            await startServer();
            await expect(server.stop()).resolves.toBeUndefined();
        });

        it('should resolve stop() immediately when never started', async () => {
            server = new Server({ logger: null });
            await expect(server.stop()).resolves.toBeUndefined();
        });
    });

    describe('connection events', () => {
        it('should emit "connection" event when a client connects', async () => {
            await startServer();
            const spy = jest.fn();
            server.on('connection', spy);
            const sock = await connectRawClient(serverPort);
            rawSockets.push(sock);
            await new Promise<void>((resolve) => setTimeout(resolve, 20));
            expect(spy).toHaveBeenCalledTimes(1);
        });

        it('should emit "disconnect" event when a client disconnects', async () => {
            await startServer();
            const spy = jest.fn();
            server.on('disconnect', spy);
            const sock = await connectRawClient(serverPort);
            rawSockets.push(sock);
            await new Promise<void>((resolve) => setTimeout(resolve, 20));
            sock.destroy();
            await new Promise<void>((resolve) => setTimeout(resolve, 50));
            expect(spy).toHaveBeenCalledTimes(1);
        });
    });

    describe('authentication — NoopAuthHandler (default)', () => {
        it('should send AUTH_RESPONSE with matching id', async () => {
            await startServer();
            const sock = await connectRawClient(serverPort);
            rawSockets.push(sock);
            sendPacket(sock, new Packet(42, PacketType.AUTH, ''));
            const response = await receivePacket(sock);
            expect(response.type).toBe(PacketType.AUTH_RESPONSE);
            expect(response.id).toBe(42);
        });

        it('should emit "login" event with result=true', async () => {
            await startServer();
            const spy = jest.fn();
            server.on('login', spy);
            const sock = await connectRawClient(serverPort);
            rawSockets.push(sock);
            sendPacket(sock, new Packet(1, PacketType.AUTH, ''));
            await receivePacket(sock);
            expect(spy).toHaveBeenCalledWith(expect.objectContaining({ result: true }));
        });
    });

    describe('authentication — PasswordAuthHandler', () => {
        it('should send AUTH_RESPONSE id=-1 on wrong password', async () => {
            await startServer({
                authHandlers: [new PasswordAuthHandler('correct')],
            });
            const sock = await connectRawClient(serverPort);
            rawSockets.push(sock);
            sendPacket(sock, new Packet(1, PacketType.AUTH, 'wrong'));
            const response = await receivePacket(sock);
            expect(response.id).toBe(-1);
        });

        it('should emit "login" event with result=false on wrong password', async () => {
            await startServer({
                authHandlers: [new PasswordAuthHandler('correct')],
            });
            const spy = jest.fn();
            server.on('login', spy);
            const sock = await connectRawClient(serverPort);
            rawSockets.push(sock);
            sendPacket(sock, new Packet(1, PacketType.AUTH, 'wrong'));
            await receivePacket(sock);
            expect(spy).toHaveBeenCalledWith(expect.objectContaining({ result: false }));
        });

        it('should send AUTH_RESPONSE with matching id on correct password', async () => {
            await startServer({
                authHandlers: [new PasswordAuthHandler('correct')],
            });
            const sock = await connectRawClient(serverPort);
            rawSockets.push(sock);
            sendPacket(sock, new Packet(5, PacketType.AUTH, 'correct'));
            const response = await receivePacket(sock);
            expect(response.id).toBe(5);
        });
    });

    describe('command execution', () => {
        it('should emit "command" event when authenticated client sends EXECCOMMAND', async () => {
            await startServer();
            const spy = jest.fn();
            server.on('command', spy);
            const sock = await connectRawClient(serverPort);
            rawSockets.push(sock);
            await authenticateClient(sock);
            sendPacket(sock, new Packet(2, PacketType.EXECCOMMAND, 'list'));
            await receivePacket(sock);
            expect(spy).toHaveBeenCalledWith(
                expect.objectContaining({ command: 'list' })
            );
        });

        it('should send RESPONSE_VALUE packet back to client', async () => {
            await startServer();
            const sock = await connectRawClient(serverPort);
            rawSockets.push(sock);
            await authenticateClient(sock);
            sendPacket(sock, new Packet(2, PacketType.EXECCOMMAND, 'list'));
            const response = await receivePacket(sock);
            expect(response.type).toBe(PacketType.RESPONSE_VALUE);
            expect(response.id).toBe(2);
        });

        it('should route "help" command to HelpCommand', async () => {
            await startServer();
            const sock = await connectRawClient(serverPort);
            rawSockets.push(sock);
            await authenticateClient(sock);
            sendPacket(sock, new Packet(2, PacketType.EXECCOMMAND, 'help'));
            const response = await receivePacket(sock);
            expect(response.data).toContain('help');
        });

        it('should return unknown-command message for unrecognized command', async () => {
            await startServer();
            const sock = await connectRawClient(serverPort);
            rawSockets.push(sock);
            await authenticateClient(sock);
            sendPacket(sock, new Packet(2, PacketType.EXECCOMMAND, 'nosuchcommand'));
            const response = await receivePacket(sock);
            expect(response.data).toContain('Unknown command');
        });

        it('should not register HelpCommand when addHelpCommand=false', async () => {
            await startServer({ addHelpCommand: false });
            const sock = await connectRawClient(serverPort);
            rawSockets.push(sock);
            await authenticateClient(sock);
            sendPacket(sock, new Packet(2, PacketType.EXECCOMMAND, 'help'));
            const response = await receivePacket(sock);
            expect(response.data).toContain('Unknown command');
        });
    });
});
