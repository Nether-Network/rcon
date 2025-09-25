import { IClient } from '@nether-network/rcon-client';
import { ClientInfo } from '../Proxy';
import { StatusCommand } from './StatusCommand';

function makeMockClient(overrides?: {
    isConnected?: boolean;
    isAuthenticated?: boolean;
}): IClient {
    return {
        connect: jest.fn().mockResolvedValue(undefined),
        send: jest.fn().mockResolvedValue(null),
        close: jest.fn().mockResolvedValue(undefined),
        isConnected: jest.fn().mockReturnValue(overrides?.isConnected ?? false),
        isAuthenticated: jest.fn().mockReturnValue(
            overrides?.isAuthenticated ?? false
        ),
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
    } as unknown as IClient;
}

function makeClientInfo(
    name: string,
    selected = false,
    clientOverrides?: { isConnected?: boolean; isAuthenticated?: boolean }
): ClientInfo {
    return { name, selected, client: makeMockClient(clientOverrides) };
}

describe('StatusCommand', () => {
    describe('metadata', () => {
        it('returns priority 50', () => {
            const cmd = new StatusCommand([]);
            expect(cmd.getPriority()).toBe(50);
        });

        it('handles "status" command', () => {
            const cmd = new StatusCommand([]);
            expect(cmd.canHandle('status')).toBe(true);
        });

        it('does not handle other commands', () => {
            const cmd = new StatusCommand([]);
            expect(cmd.canHandle('use')).toBe(false);
            expect(cmd.canHandle('help')).toBe(false);
            expect(cmd.canHandle('')).toBe(false);
        });

        it('returns name "status"', () => {
            const cmd = new StatusCommand([]);
            expect(cmd.getName()).toBe('status');
        });

        it('returns description', () => {
            const cmd = new StatusCommand([]);
            expect(cmd.getDescription()).toBe('Show server status');
        });
    });

    describe('execute', () => {
        it('returns empty string when there are no clients', async () => {
            const cmd = new StatusCommand([]);
            const result = await cmd.execute('status', []);
            expect(result).toBe('');
        });

        it('shows Offline for a disconnected client', async () => {
            const clients = [makeClientInfo('server1', false, { isConnected: false })];
            const cmd = new StatusCommand(clients);
            const result = await cmd.execute('status', []);
            expect(result).toContain('server1');
            expect(result).toContain('Offline');
        });

        it('shows Authenticating for connected but unauthenticated client', async () => {
            const clients = [
                makeClientInfo('server1', false, {
                    isConnected: true,
                    isAuthenticated: false,
                }),
            ];
            const cmd = new StatusCommand(clients);
            const result = await cmd.execute('status', []);
            expect(result).toContain('server1');
            expect(result).toContain('Authenticating');
        });

        it('shows Online for connected and authenticated client', async () => {
            const clients = [
                makeClientInfo('server1', false, {
                    isConnected: true,
                    isAuthenticated: true,
                }),
            ];
            const cmd = new StatusCommand(clients);
            const result = await cmd.execute('status', []);
            expect(result).toContain('server1');
            expect(result).toContain('Online');
        });

        it('prefixes selected client with "> "', async () => {
            const clients = [makeClientInfo('server1', true)];
            const cmd = new StatusCommand(clients);
            const result = await cmd.execute('status', []);
            expect(result).toContain('> ');
        });

        it('prefixes unselected client with two spaces', async () => {
            const clients = [makeClientInfo('server1', false)];
            const cmd = new StatusCommand(clients);
            const result = await cmd.execute('status', []);
            expect(result).toMatch(/^\s{2}/);
            expect(result).not.toContain('> ');
        });

        it('separates multiple clients with newlines', async () => {
            const clients = [
                makeClientInfo('server1', false),
                makeClientInfo('server2', true),
            ];
            const cmd = new StatusCommand(clients);
            const result = await cmd.execute('status', []);
            expect(result).toContain('\n');
            expect(result).toContain('server1');
            expect(result).toContain('server2');
        });

        it('only marks the selected client with "> "', async () => {
            const clients = [
                makeClientInfo('server1', false),
                makeClientInfo('server2', true),
                makeClientInfo('server3', false),
            ];
            const cmd = new StatusCommand(clients);
            const result = await cmd.execute('status', []);
            const lines = result!.split('\n');
            const selectedLines = lines.filter((l) => l.includes('> '));
            expect(selectedLines).toHaveLength(1);
            expect(selectedLines[0]).toContain('server2');
        });
    });
});
