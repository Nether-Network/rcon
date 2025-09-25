import { Client } from './Client';
import {
    Packet,
    PacketType,
    MockSocket,
    MockSocketOptions,
    ISocketFactory,
    ISocket,
    ValidationError,
    ConnectionError,
    AuthenticationError,
} from '@nether-network/rcon-common';

// A capturing factory that exposes the last created MockSocket so tests can call simulateReceive
class CapturingSocketFactory implements ISocketFactory {
    public lastSocket: MockSocket | null = null;
    constructor(private options: MockSocketOptions = {}) {}
    createSocket(): ISocket {
        this.lastSocket = new MockSocket(this.options);
        return this.lastSocket;
    }
}

function makeAuthResponseBuffer(id: number): Buffer {
    return new Packet(id, PacketType.AUTH_RESPONSE, '').toBuffer();
}

function makeResponseValueBuffer(id: number, body: string): Buffer {
    return new Packet(id, PacketType.RESPONSE_VALUE, body).toBuffer();
}

const validUri = { host: '127.0.0.1', port: 25575, password: 'secret', tls: false };

function makeClient(socketOptions: MockSocketOptions = {}): {
    client: Client;
    factory: CapturingSocketFactory;
} {
    const factory = new CapturingSocketFactory(socketOptions);
    const client = new Client({ uri: validUri, logger: null, socketFactory: factory });
    return { client, factory };
}

// Helper: begin connecting and, after a tick (so socket connect fires), feed an auth response.
// Returns the connect() promise.
async function connectAndAuth(
    client: Client,
    factory: CapturingSocketFactory,
    authResponseId: number = 1
): Promise<void> {
    const connectPromise = client.connect();
    // Wait for socket connect event to fire and AUTH packet to be sent
    await new Promise<void>((resolve) => setTimeout(resolve, 10));
    factory.lastSocket!.simulateReceive(makeAuthResponseBuffer(authResponseId));
    return connectPromise;
}

describe('Client', () => {
    describe('constructor', () => {
        it('should construct without throwing given valid options', () => {
            expect(() => new Client({ uri: validUri })).not.toThrow();
        });

        it('should throw ValidationError for null options', () => {
            expect(() => new Client(null as any)).toThrow(ValidationError);
        });

        it('should start in disconnected state', () => {
            const { client } = makeClient();
            expect(client.isConnected()).toBe(false);
        });

        it('should start unauthenticated', () => {
            const { client } = makeClient();
            expect(client.isAuthenticated()).toBe(false);
        });
    });

    describe('connect() — happy path', () => {
        it('should resolve after successful connection and auth', async () => {
            const { client, factory } = makeClient();
            await expect(connectAndAuth(client, factory)).resolves.toBeUndefined();
            await client.close();
        });

        it('should emit "connected" event when socket connects', async () => {
            const { client, factory } = makeClient();
            const spy = jest.fn();
            client.on('connected', spy);
            await connectAndAuth(client, factory);
            expect(spy).toHaveBeenCalledTimes(1);
            await client.close();
        });

        it('should emit "authenticated" event when auth succeeds', async () => {
            const { client, factory } = makeClient();
            const spy = jest.fn();
            client.on('authenticated', spy);
            await connectAndAuth(client, factory);
            expect(spy).toHaveBeenCalledTimes(1);
            await client.close();
        });

        it('should set isConnected() to true after connect', async () => {
            const { client, factory } = makeClient();
            await connectAndAuth(client, factory);
            expect(client.isConnected()).toBe(true);
            await client.close();
        });

        it('should set isAuthenticated() to true after connect', async () => {
            const { client, factory } = makeClient();
            await connectAndAuth(client, factory);
            expect(client.isAuthenticated()).toBe(true);
            await client.close();
        });

        it('should send an AUTH packet with type PacketType.AUTH (3)', async () => {
            const { client, factory } = makeClient();
            const connectPromise = client.connect();
            await new Promise<void>((resolve) => setTimeout(resolve, 10));

            const written = factory.lastSocket!.getWrittenData();
            expect(written.length).toBeGreaterThan(0);
            // Parse the packet: first 4 bytes are the length field
            const buf = written[0];
            const packet = Packet.fromBuffer(buf.slice(4));
            expect(packet.type).toBe(PacketType.AUTH);

            factory.lastSocket!.simulateReceive(makeAuthResponseBuffer(1));
            await connectPromise;
            await client.close();
        });

        it('should send AUTH packet with the configured password as body', async () => {
            const { client, factory } = makeClient();
            const connectPromise = client.connect();
            await new Promise<void>((resolve) => setTimeout(resolve, 10));

            const buf = factory.lastSocket!.getWrittenData()[0];
            const packet = Packet.fromBuffer(buf.slice(4));
            expect(packet.data).toBe('secret');

            factory.lastSocket!.simulateReceive(makeAuthResponseBuffer(1));
            await connectPromise;
            await client.close();
        });
    });

    describe('connect() — failure cases', () => {
        it('should reject with ConnectionError when socket fails to connect', async () => {
            const { client } = makeClient({
                shouldConnect: false,
            });
            await expect(client.connect()).rejects.toThrow(ConnectionError);
        });

        it('should reject with AuthenticationError when server returns AUTH_RESPONSE id=-1', async () => {
            const { client, factory } = makeClient();
            const connectPromise = client.connect();
            await new Promise<void>((resolve) => setTimeout(resolve, 10));
            factory.lastSocket!.simulateReceive(makeAuthResponseBuffer(-1));
            await expect(connectPromise).rejects.toThrow(AuthenticationError);
        });

        it('should return to disconnected state after auth failure', async () => {
            const { client, factory } = makeClient();
            const connectPromise = client.connect();
            await new Promise<void>((resolve) => setTimeout(resolve, 10));
            factory.lastSocket!.simulateReceive(makeAuthResponseBuffer(-1));
            await connectPromise.catch(() => {});
            // Give close() time to propagate
            await new Promise<void>((resolve) => setTimeout(resolve, 20));
            expect(client.isConnected()).toBe(false);
            expect(client.isAuthenticated()).toBe(false);
        });

        it('should return resolved promise when connect() called while already connected', async () => {
            const { client, factory } = makeClient();
            await connectAndAuth(client, factory);
            await expect(client.connect()).resolves.toBeUndefined();
            await client.close();
        });
    });

    describe('send()', () => {
        it('should resolve with server response body', async () => {
            const { client, factory } = makeClient();
            await connectAndAuth(client, factory);

            const sendPromise = client.send('status');
            await new Promise<void>((resolve) => setTimeout(resolve, 10));
            // The first send() uses nextRequestId = 2 (1 was used for auth)
            const written = factory.lastSocket!.getWrittenData();
            const cmdBuf = written[written.length - 1];
            const cmdPacket = Packet.fromBuffer(cmdBuf.slice(4));
            factory.lastSocket!.simulateReceive(
                makeResponseValueBuffer(cmdPacket.id, 'online: 3')
            );

            const result = await sendPromise;
            expect(result).toBe('online: 3');
            await client.close();
        });

        it('should send EXECCOMMAND packet with correct type', async () => {
            const { client, factory } = makeClient();
            await connectAndAuth(client, factory);

            const sendPromise = client.send('list');
            await new Promise<void>((resolve) => setTimeout(resolve, 10));

            const written = factory.lastSocket!.getWrittenData();
            const cmdBuf = written[written.length - 1];
            const cmdPacket = Packet.fromBuffer(cmdBuf.slice(4));
            expect(cmdPacket.type).toBe(PacketType.EXECCOMMAND);
            expect(cmdPacket.data).toBe('list');

            factory.lastSocket!.simulateReceive(makeResponseValueBuffer(cmdPacket.id, ''));
            await sendPromise;
            await client.close();
        });

        it('should reject with ConnectionError when not connected', async () => {
            const { client } = makeClient();
            await expect(client.send('list')).rejects.toThrow(ConnectionError);
        });

        it('should reject with AuthenticationError when connected but not authenticated', async () => {
            // Connect with auth response that would succeed but we'll catch state mid-flight.
            // Easier: connect, close, reconnect halfway — just test directly with a client that
            // had connect fail after socket was open. Instead we test via the guard.
            const { client, factory } = makeClient();
            // Start connect, don't complete auth
            const connectPromise = client.connect();
            await new Promise<void>((resolve) => setTimeout(resolve, 10));
            // Socket is connected but not authenticated yet
            await expect(client.send('list')).rejects.toThrow(AuthenticationError);
            // Finish auth to avoid leaking
            factory.lastSocket!.simulateReceive(makeAuthResponseBuffer(1));
            await connectPromise;
            await client.close();
        });

        it('should handle concurrent sends and match responses by id', async () => {
            const { client, factory } = makeClient();
            await connectAndAuth(client, factory);

            const p1 = client.send('cmd1');
            const p2 = client.send('cmd2');
            await new Promise<void>((resolve) => setTimeout(resolve, 10));

            const written = factory.lastSocket!.getWrittenData();
            const pkt1 = Packet.fromBuffer(written[written.length - 2].slice(4));
            const pkt2 = Packet.fromBuffer(written[written.length - 1].slice(4));

            factory.lastSocket!.simulateReceive(makeResponseValueBuffer(pkt1.id, 'res1'));
            factory.lastSocket!.simulateReceive(makeResponseValueBuffer(pkt2.id, 'res2'));

            expect(await p1).toBe('res1');
            expect(await p2).toBe('res2');
            await client.close();
        });

        it('should silently ignore RESPONSE_VALUE packet with unknown id', async () => {
            const { client, factory } = makeClient();
            await connectAndAuth(client, factory);

            // Send a RESPONSE_VALUE with an id that has no pending request
            expect(() => {
                factory.lastSocket!.simulateReceive(makeResponseValueBuffer(9999, 'orphan'));
            }).not.toThrow();

            await client.close();
        });
    });

    describe('close()', () => {
        it('should resolve immediately when not connected', async () => {
            const { client } = makeClient();
            await expect(client.close()).resolves.toBeUndefined();
        });

        it('should emit "disconnected" event when closed', async () => {
            const { client, factory } = makeClient();
            await connectAndAuth(client, factory);
            const spy = jest.fn();
            client.on('disconnected', spy);
            await client.close();
            await new Promise<void>((resolve) => setTimeout(resolve, 20));
            expect(spy).toHaveBeenCalledTimes(1);
        });

        it('should set isConnected() to false after close', async () => {
            const { client, factory } = makeClient();
            await connectAndAuth(client, factory);
            await client.close();
            await new Promise<void>((resolve) => setTimeout(resolve, 20));
            expect(client.isConnected()).toBe(false);
        });

        it('should set isAuthenticated() to false after close', async () => {
            const { client, factory } = makeClient();
            await connectAndAuth(client, factory);
            await client.close();
            await new Promise<void>((resolve) => setTimeout(resolve, 20));
            expect(client.isAuthenticated()).toBe(false);
        });
    });

    describe('error events', () => {
        it('should emit "error" event when socket emits error after connection', async () => {
            const { client, factory } = makeClient();
            await connectAndAuth(client, factory);
            const spy = jest.fn();
            client.on('error', spy);
            factory.lastSocket!.simulateError(new Error('socket died'));
            expect(spy).toHaveBeenCalledTimes(1);
            await client.close();
        });
    });
});
