import { AuthPacketHandler } from './AuthPacketHandler';
import { CommandPacketHandler } from './CommandPacketHandler';
import { Packet, PacketType, PacketStreamParser } from '@nether-network/rcon-common';
import { ConnectedClient } from '../../ConnectedClient';

function makeMockServer(overrides: Partial<{
    authenticate: jest.Mock;
    send: jest.Mock;
    emit: jest.Mock;
    executeCommand: jest.Mock;
}> = {}): any {
    return {
        authenticate: jest.fn().mockResolvedValue(true),
        send: jest.fn().mockReturnValue(true),
        emit: jest.fn(),
        executeCommand: jest.fn().mockResolvedValue('ok'),
        ...overrides,
    };
}

function makeMockClient(overrides: Partial<ConnectedClient> = {}): ConnectedClient {
    return {
        id: 'test-client-1',
        socket: { write: jest.fn().mockReturnValue(true) } as any,
        authenticated: false,
        packetParser: new PacketStreamParser(),
        logger: null,
        extra: {},
        ...overrides,
    };
}

describe('AuthPacketHandler', () => {
    describe('canHandle', () => {
        it('should return true for AUTH packet', () => {
            const handler = new AuthPacketHandler(makeMockServer());
            const packet = new Packet(1, PacketType.AUTH, 'password');
            expect(handler.canHandle(packet)).toBe(true);
        });

        it('should return false for EXECCOMMAND packet', () => {
            const handler = new AuthPacketHandler(makeMockServer());
            const packet = new Packet(1, PacketType.EXECCOMMAND, 'cmd');
            expect(handler.canHandle(packet)).toBe(false);
        });

        it('should return false for RESPONSE_VALUE packet', () => {
            const handler = new AuthPacketHandler(makeMockServer());
            const packet = new Packet(1, PacketType.RESPONSE_VALUE, '');
            expect(handler.canHandle(packet)).toBe(false);
        });
    });

    describe('handle — unauthenticated client, successful auth', () => {
        it('should call server.authenticate() with the packet body as password', async () => {
            const server = makeMockServer();
            const handler = new AuthPacketHandler(server);
            const client = makeMockClient();
            const packet = new Packet(42, PacketType.AUTH, 'mypassword');

            await handler.handle(client, packet);

            expect(server.authenticate).toHaveBeenCalledWith('mypassword');
        });

        it('should set client.authenticated = true on success', async () => {
            const handler = new AuthPacketHandler(makeMockServer());
            const client = makeMockClient();
            const packet = new Packet(42, PacketType.AUTH, 'pw');

            await handler.handle(client, packet);

            expect(client.authenticated).toBe(true);
        });

        it('should send AUTH_RESPONSE packet with matching id on success', async () => {
            const server = makeMockServer();
            const handler = new AuthPacketHandler(server);
            const client = makeMockClient();
            const packet = new Packet(42, PacketType.AUTH, 'pw');

            await handler.handle(client, packet);

            expect(server.send).toHaveBeenCalledTimes(1);
            const responsePacket: Packet = server.send.mock.calls[0][1];
            expect(responsePacket.type).toBe(PacketType.AUTH_RESPONSE);
            expect(responsePacket.id).toBe(42);
        });

        it('should emit "login" event with result=true and password', async () => {
            const server = makeMockServer();
            const handler = new AuthPacketHandler(server);
            const client = makeMockClient();
            const packet = new Packet(42, PacketType.AUTH, 'pw');

            await handler.handle(client, packet);

            expect(server.emit).toHaveBeenCalledWith(
                'login',
                expect.objectContaining({ client, result: true, password: 'pw' })
            );
        });
    });

    describe('handle — unauthenticated client, failed auth', () => {
        it('should NOT set client.authenticated on failure', async () => {
            const server = makeMockServer({ authenticate: jest.fn().mockResolvedValue(false) });
            const handler = new AuthPacketHandler(server);
            const client = makeMockClient();
            const packet = new Packet(5, PacketType.AUTH, 'wrong');

            await handler.handle(client, packet);

            expect(client.authenticated).toBe(false);
        });

        it('should send AUTH_RESPONSE packet with id=-1 on failure', async () => {
            const server = makeMockServer({ authenticate: jest.fn().mockResolvedValue(false) });
            const handler = new AuthPacketHandler(server);
            const client = makeMockClient();
            const packet = new Packet(5, PacketType.AUTH, 'wrong');

            await handler.handle(client, packet);

            const responsePacket: Packet = server.send.mock.calls[0][1];
            expect(responsePacket.id).toBe(-1);
            expect(responsePacket.type).toBe(PacketType.AUTH_RESPONSE);
        });

        it('should emit "login" event with result=false on failure', async () => {
            const server = makeMockServer({ authenticate: jest.fn().mockResolvedValue(false) });
            const handler = new AuthPacketHandler(server);
            const client = makeMockClient();
            const packet = new Packet(5, PacketType.AUTH, 'wrong');

            await handler.handle(client, packet);

            expect(server.emit).toHaveBeenCalledWith(
                'login',
                expect.objectContaining({ result: false })
            );
        });
    });

    describe('handle — already authenticated client', () => {
        it('should send AUTH_RESPONSE with matching id without calling authenticate', async () => {
            const server = makeMockServer();
            const handler = new AuthPacketHandler(server);
            const client = makeMockClient({ authenticated: true });
            const packet = new Packet(99, PacketType.AUTH, 'pw');

            await handler.handle(client, packet);

            expect(server.authenticate).not.toHaveBeenCalled();
            const responsePacket: Packet = server.send.mock.calls[0][1];
            expect(responsePacket.id).toBe(99);
        });

        it('should NOT emit "login" event when already authenticated', async () => {
            const server = makeMockServer();
            const handler = new AuthPacketHandler(server);
            const client = makeMockClient({ authenticated: true });
            const packet = new Packet(99, PacketType.AUTH, 'pw');

            await handler.handle(client, packet);

            expect(server.emit).not.toHaveBeenCalledWith('login', expect.anything());
        });
    });

    describe('handle — null/empty packet data', () => {
        it('should treat null body as empty string password', async () => {
            const server = makeMockServer();
            const handler = new AuthPacketHandler(server);
            const client = makeMockClient();
            const packet = new Packet(1, PacketType.AUTH);

            await handler.handle(client, packet);

            expect(server.authenticate).toHaveBeenCalledWith('');
        });
    });
});

describe('CommandPacketHandler', () => {
    describe('canHandle', () => {
        it('should return true for EXECCOMMAND packet', () => {
            const handler = new CommandPacketHandler(makeMockServer());
            const packet = new Packet(1, PacketType.EXECCOMMAND, 'cmd');
            expect(handler.canHandle(packet)).toBe(true);
        });

        it('should return false for AUTH packet', () => {
            const handler = new CommandPacketHandler(makeMockServer());
            const packet = new Packet(1, PacketType.AUTH, 'pw');
            expect(handler.canHandle(packet)).toBe(false);
        });

        it('should return false for RESPONSE_VALUE packet', () => {
            const handler = new CommandPacketHandler(makeMockServer());
            const packet = new Packet(1, PacketType.RESPONSE_VALUE, '');
            expect(handler.canHandle(packet)).toBe(false);
        });
    });

    describe('handle — normal command', () => {
        it('should parse "list players" into command and args and call executeCommand', async () => {
            const server = makeMockServer();
            const handler = new CommandPacketHandler(server);
            const client = makeMockClient();
            const packet = new Packet(10, PacketType.EXECCOMMAND, 'list players');

            await handler.handle(client, packet);

            expect(server.executeCommand).toHaveBeenCalledWith('list', ['players']);
        });

        it('should send RESPONSE_VALUE packet with result body and matching id', async () => {
            const server = makeMockServer({ executeCommand: jest.fn().mockResolvedValue('result text') });
            const handler = new CommandPacketHandler(server);
            const client = makeMockClient();
            const packet = new Packet(10, PacketType.EXECCOMMAND, 'list');

            await handler.handle(client, packet);

            const responsePacket: Packet = server.send.mock.calls[0][1];
            expect(responsePacket.type).toBe(PacketType.RESPONSE_VALUE);
            expect(responsePacket.id).toBe(10);
            expect(responsePacket.data).toBe('result text');
        });

        it('should emit "command" event with client, command, and args', async () => {
            const server = makeMockServer();
            const handler = new CommandPacketHandler(server);
            const client = makeMockClient();
            const packet = new Packet(10, PacketType.EXECCOMMAND, 'kick player1');

            await handler.handle(client, packet);

            expect(server.emit).toHaveBeenCalledWith(
                'command',
                expect.objectContaining({ client, command: 'kick', args: ['player1'] })
            );
        });
    });

    describe('handle — command with no arguments', () => {
        it('should parse "help" into command="help" and args=[]', async () => {
            const server = makeMockServer();
            const handler = new CommandPacketHandler(server);
            const client = makeMockClient();
            const packet = new Packet(1, PacketType.EXECCOMMAND, 'help');

            await handler.handle(client, packet);

            expect(server.executeCommand).toHaveBeenCalledWith('help', []);
        });
    });

    describe('handle — command with multiple arguments', () => {
        it('should parse "kick p1 reason text" into correct parts', async () => {
            const server = makeMockServer();
            const handler = new CommandPacketHandler(server);
            const client = makeMockClient();
            const packet = new Packet(1, PacketType.EXECCOMMAND, 'kick p1 reason text');

            await handler.handle(client, packet);

            expect(server.executeCommand).toHaveBeenCalledWith('kick', ['p1', 'reason', 'text']);
        });
    });

    describe('handle — null packet data', () => {
        it('should return early without calling executeCommand', async () => {
            const server = makeMockServer();
            const handler = new CommandPacketHandler(server);
            const client = makeMockClient();
            const packet = new Packet(1, PacketType.EXECCOMMAND);

            await handler.handle(client, packet);

            expect(server.executeCommand).not.toHaveBeenCalled();
            expect(server.send).not.toHaveBeenCalled();
        });
    });

    describe('handle — executeCommand throws error', () => {
        it('should send RESPONSE_VALUE with error message body', async () => {
            const server = makeMockServer({
                executeCommand: jest.fn().mockRejectedValue(new Error('exec failed')),
            });
            const handler = new CommandPacketHandler(server);
            const client = makeMockClient();
            const packet = new Packet(7, PacketType.EXECCOMMAND, 'badcmd');

            await handler.handle(client, packet);

            const responsePacket: Packet = server.send.mock.calls[0][1];
            expect(responsePacket.data).toContain('exec failed');
        });

        it('should not propagate the exception', async () => {
            const server = makeMockServer({
                executeCommand: jest.fn().mockRejectedValue(new Error('boom')),
            });
            const handler = new CommandPacketHandler(server);
            const client = makeMockClient();
            const packet = new Packet(1, PacketType.EXECCOMMAND, 'cmd');

            await expect(handler.handle(client, packet)).resolves.toBeUndefined();
        });

        it('should not emit "command" event when executeCommand throws', async () => {
            const server = makeMockServer({
                executeCommand: jest.fn().mockRejectedValue(new Error('boom')),
            });
            const handler = new CommandPacketHandler(server);
            const client = makeMockClient();
            const packet = new Packet(1, PacketType.EXECCOMMAND, 'cmd');

            await handler.handle(client, packet);

            expect(server.emit).not.toHaveBeenCalledWith('command', expect.anything());
        });
    });
});
