import { ValidationError } from '@nether-network/rcon-common';

jest.mock('@nether-network/rcon-server', () => ({
    Server: jest.fn(),
    NoopAuthHandler: jest.fn(),
}));

jest.mock('@nether-network/rcon-client', () => ({
    Client: jest.fn(),
}));

import { Client } from '@nether-network/rcon-client';
import { Server, NoopAuthHandler } from '@nether-network/rcon-server';
import { Proxy } from './Proxy';

const MockClient = jest.mocked(Client);
const MockServer = jest.mocked(Server);
const MockNoopAuthHandler = jest.mocked(NoopAuthHandler);

const validServer = {
    name: 'test-server',
    host: '127.0.0.1',
    port: 25576,
    password: 'secret',
};

let mockClientOn: jest.Mock;
let mockClientConnect: jest.Mock;
let mockServerStart: jest.Mock;

beforeEach(() => {
    jest.clearAllMocks();

    mockClientOn = jest.fn();
    mockClientConnect = jest.fn().mockResolvedValue(undefined);
    mockServerStart = jest.fn().mockResolvedValue(undefined);

    MockClient.mockImplementation(
        () =>
            ({
                on: mockClientOn,
                connect: mockClientConnect,
            }) as unknown as Client
    );

    MockServer.mockImplementation(
        () =>
            ({
                start: mockServerStart,
                on: jest.fn(),
            }) as unknown as Server
    );
});

describe('Proxy constructor', () => {
    describe('validation', () => {
        it('throws ValidationError when options is null', () => {
            expect(() => new Proxy(null as never)).toThrow(ValidationError);
        });

        it('throws ValidationError when servers array is empty', () => {
            expect(() => new Proxy({ servers: [] })).toThrow(ValidationError);
        });

        it('throws ValidationError when port is in privileged range', () => {
            expect(
                () => new Proxy({ servers: [validServer], port: 80 })
            ).toThrow(ValidationError);
        });

        it('throws ValidationError when server names are duplicated', () => {
            expect(
                () =>
                    new Proxy({
                        servers: [
                            validServer,
                            { ...validServer, port: 25577 },
                        ],
                    })
            ).toThrow(ValidationError);
        });
    });

    describe('client instantiation', () => {
        it('creates one Client per server', () => {
            new Proxy({
                servers: [
                    validServer,
                    { name: 'server2', host: '127.0.0.1', port: 25577 },
                ],
            });
            expect(MockClient).toHaveBeenCalledTimes(2);
        });

        it('creates Client with correct URI from server config', () => {
            new Proxy({ servers: [validServer] });
            expect(MockClient).toHaveBeenCalledWith(
                expect.objectContaining({
                    uri: expect.objectContaining({
                        host: validServer.host,
                        port: validServer.port,
                        password: validServer.password,
                    }),
                })
            );
        });

        it('registers disconnected and error listeners on each client', () => {
            new Proxy({ servers: [validServer] });
            const eventNames = mockClientOn.mock.calls.map(
                (call: [string, ...unknown[]]) => call[0]
            );
            expect(eventNames).toContain('disconnected');
            expect(eventNames).toContain('error');
        });
    });

    describe('server instantiation', () => {
        it('creates exactly one Server', () => {
            new Proxy({ servers: [validServer] });
            expect(MockServer).toHaveBeenCalledTimes(1);
        });

        it('passes host to Server', () => {
            new Proxy({ servers: [validServer], host: '0.0.0.0' });
            expect(MockServer).toHaveBeenCalledWith(
                expect.objectContaining({ host: '0.0.0.0' })
            );
        });

        it('passes port to Server', () => {
            new Proxy({ servers: [validServer], port: 25580 });
            expect(MockServer).toHaveBeenCalledWith(
                expect.objectContaining({ port: 25580 })
            );
        });

        it('passes three commands to Server', () => {
            new Proxy({ servers: [validServer] });
            const serverOptions = (MockServer.mock.calls[0] as [{ commands: unknown[] }])[0];
            expect(serverOptions.commands).toHaveLength(3);
        });

        it('uses NoopAuthHandler when no authHandlers provided', () => {
            new Proxy({ servers: [validServer] });
            expect(MockNoopAuthHandler).toHaveBeenCalledTimes(1);
            const serverOptions = (MockServer.mock.calls[0] as [{ authHandlers: unknown[] }])[0];
            expect(serverOptions.authHandlers).toHaveLength(1);
        });

        it('uses provided authHandlers instead of NoopAuthHandler', () => {
            const customHandler = { authenticate: jest.fn().mockResolvedValue(true) };
            new Proxy({ servers: [validServer], authHandlers: [customHandler] });
            expect(MockNoopAuthHandler).not.toHaveBeenCalled();
            const serverOptions = (MockServer.mock.calls[0] as [{ authHandlers: unknown[] }])[0];
            expect(serverOptions.authHandlers).toContain(customHandler);
        });
    });

    describe('defaults', () => {
        it('uses host 127.0.0.1 when not specified', () => {
            new Proxy({ servers: [validServer] });
            expect(MockServer).toHaveBeenCalledWith(
                expect.objectContaining({ host: '127.0.0.1' })
            );
        });

        it('uses port 25575 when not specified', () => {
            new Proxy({ servers: [validServer] });
            expect(MockServer).toHaveBeenCalledWith(
                expect.objectContaining({ port: 25575 })
            );
        });
    });
});

describe('Proxy.start()', () => {
    it('starts the server', async () => {
        const proxy = new Proxy({ servers: [validServer] });
        await proxy.start();
        expect(mockServerStart).toHaveBeenCalledTimes(1);
    });

    it('connects every backend client', async () => {
        const proxy = new Proxy({
            servers: [
                validServer,
                { name: 'server2', host: '127.0.0.1', port: 25577 },
            ],
        });
        await proxy.start();
        expect(mockClientConnect).toHaveBeenCalledTimes(2);
    });

    it('connects clients after starting the server', async () => {
        const callOrder: string[] = [];
        mockServerStart.mockImplementation(async () => {
            callOrder.push('server.start');
        });
        mockClientConnect.mockImplementation(async () => {
            callOrder.push('client.connect');
        });

        const proxy = new Proxy({ servers: [validServer] });
        await proxy.start();

        expect(callOrder[0]).toBe('server.start');
        expect(callOrder[1]).toBe('client.connect');
    });
});

describe('Proxy reconnect behavior', () => {
    it('reconnects client after disconnect event', () => {
        jest.useFakeTimers();

        const proxy = new Proxy({
            servers: [validServer],
            reconnectInterval: 5000,
        });

        // Find the 'disconnected' callback registered on the client
        const disconnectedCall = mockClientOn.mock.calls.find(
            (call: [string, ...unknown[]]) => call[0] === 'disconnected'
        );
        expect(disconnectedCall).toBeDefined();
        const disconnectedCallback = disconnectedCall![1] as () => void;

        // Simulate disconnect
        disconnectedCallback();
        expect(mockClientConnect).not.toHaveBeenCalled();

        // Advance past the reconnect interval
        jest.advanceTimersByTime(5000);
        expect(mockClientConnect).toHaveBeenCalledTimes(1);

        jest.useRealTimers();
        void proxy;
    });

    it('uses custom reconnectInterval for reconnect delay', () => {
        jest.useFakeTimers();

        const proxy = new Proxy({
            servers: [validServer],
            reconnectInterval: 2000,
        });

        const disconnectedCall = mockClientOn.mock.calls.find(
            (call: [string, ...unknown[]]) => call[0] === 'disconnected'
        );
        const disconnectedCallback = disconnectedCall![1] as () => void;

        disconnectedCallback();

        // Should not reconnect before interval
        jest.advanceTimersByTime(1999);
        expect(mockClientConnect).not.toHaveBeenCalled();

        // Should reconnect at interval
        jest.advanceTimersByTime(1);
        expect(mockClientConnect).toHaveBeenCalledTimes(1);

        jest.useRealTimers();
        void proxy;
    });
});
