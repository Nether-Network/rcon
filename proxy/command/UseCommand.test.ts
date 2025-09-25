import { IClient } from '@nether-network/rcon-client';
import { ClientInfo } from '../Proxy';
import { UseCommand } from './UseCommand';

function makeClientInfo(name: string, selected = false): ClientInfo {
    return {
        name,
        selected,
        client: {
            connect: jest.fn(),
            send: jest.fn(),
            close: jest.fn(),
            isConnected: jest.fn().mockReturnValue(false),
            isAuthenticated: jest.fn().mockReturnValue(false),
            on: jest.fn(),
            off: jest.fn(),
            emit: jest.fn(),
        } as unknown as IClient,
    };
}

describe('UseCommand', () => {
    describe('metadata', () => {
        it('returns priority 50', () => {
            const cmd = new UseCommand([]);
            expect(cmd.getPriority()).toBe(50);
        });

        it('handles "use" command', () => {
            const cmd = new UseCommand([]);
            expect(cmd.canHandle('use')).toBe(true);
        });

        it('does not handle other commands', () => {
            const cmd = new UseCommand([]);
            expect(cmd.canHandle('status')).toBe(false);
            expect(cmd.canHandle('help')).toBe(false);
            expect(cmd.canHandle('')).toBe(false);
        });

        it('returns name "use"', () => {
            const cmd = new UseCommand([]);
            expect(cmd.getName()).toBe('use');
        });

        it('returns description', () => {
            const cmd = new UseCommand([]);
            expect(cmd.getDescription()).toBe(
                'Select a server to use: use <server_name>'
            );
        });
    });

    describe('execute', () => {
        it('returns usage hint when called with no arguments', async () => {
            const cmd = new UseCommand([makeClientInfo('server1')]);
            const result = await cmd.execute('use', []);
            expect(result).toContain('use <server_name>');
        });

        it('selects the matching server', async () => {
            const clients = [makeClientInfo('server1'), makeClientInfo('server2')];
            const cmd = new UseCommand(clients);
            await cmd.execute('use', ['server2']);
            expect(clients[1].selected).toBe(true);
        });

        it('returns a success message containing the server name', async () => {
            const clients = [makeClientInfo('server1')];
            const cmd = new UseCommand(clients);
            const result = await cmd.execute('use', ['server1']);
            expect(result).toContain('server1');
        });

        it('deselects all other servers when selecting one', async () => {
            const clients = [
                makeClientInfo('server1', true),
                makeClientInfo('server2', false),
                makeClientInfo('server3', false),
            ];
            const cmd = new UseCommand(clients);
            await cmd.execute('use', ['server2']);
            expect(clients[0].selected).toBe(false);
            expect(clients[1].selected).toBe(true);
            expect(clients[2].selected).toBe(false);
        });

        it('returns an error message for an unknown server name', async () => {
            const clients = [makeClientInfo('server1')];
            const cmd = new UseCommand(clients);
            const result = await cmd.execute('use', ['nonexistent']);
            expect(result).toContain('not found');
            expect(result).toContain('nonexistent');
        });

        it('does not change selection when target server is not found', async () => {
            const clients = [makeClientInfo('server1', true)];
            const cmd = new UseCommand(clients);
            await cmd.execute('use', ['nonexistent']);
            expect(clients[0].selected).toBe(true);
        });
    });
});
