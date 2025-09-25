import { IClient } from '@nether-network/rcon-client';
import { ClientInfo } from '../Proxy';
import { ProxyPassCommand } from './ProxyPassCommand';

function makeClientInfo(
    name: string,
    selected: boolean,
    sendResult: string | null = null
): ClientInfo {
    return {
        name,
        selected,
        client: {
            connect: jest.fn(),
            send: jest.fn().mockResolvedValue(sendResult),
            close: jest.fn(),
            isConnected: jest.fn().mockReturnValue(false),
            isAuthenticated: jest.fn().mockReturnValue(false),
            on: jest.fn(),
            off: jest.fn(),
            emit: jest.fn(),
        } as unknown as IClient,
    };
}

describe('ProxyPassCommand', () => {
    describe('metadata', () => {
        it('returns priority 110', () => {
            const cmd = new ProxyPassCommand([]);
            expect(cmd.getPriority()).toBe(110);
        });

        it('handles any command', () => {
            const cmd = new ProxyPassCommand([]);
            expect(cmd.canHandle('say')).toBe(true);
            expect(cmd.canHandle('time')).toBe(true);
            expect(cmd.canHandle('')).toBe(true);
            expect(cmd.canHandle('anything')).toBe(true);
        });
    });

    describe('execute', () => {
        it('returns "No server selected." when no client is selected', async () => {
            const clients = [makeClientInfo('server1', false)];
            const cmd = new ProxyPassCommand(clients);
            const result = await cmd.execute('say', []);
            expect(result).toBe('No server selected.');
        });

        it('returns "No server selected." when clients list is empty', async () => {
            const cmd = new ProxyPassCommand([]);
            const result = await cmd.execute('say', []);
            expect(result).toBe('No server selected.');
        });

        it('forwards the command to the selected client', async () => {
            const clients = [makeClientInfo('server1', true, 'done')];
            const cmd = new ProxyPassCommand(clients);
            await cmd.execute('say', []);
            expect(clients[0].client.send).toHaveBeenCalledWith('say');
        });

        it('joins command and args with spaces before sending', async () => {
            const clients = [makeClientInfo('server1', true)];
            const cmd = new ProxyPassCommand(clients);
            await cmd.execute('say', ['hello', 'world']);
            expect(clients[0].client.send).toHaveBeenCalledWith('say hello world');
        });

        it('returns the response from the selected client', async () => {
            const clients = [makeClientInfo('server1', true, 'players online: 3')];
            const cmd = new ProxyPassCommand(clients);
            const result = await cmd.execute('list', []);
            expect(result).toBe('players online: 3');
        });

        it('returns null when the client returns null', async () => {
            const clients = [makeClientInfo('server1', true, null)];
            const cmd = new ProxyPassCommand(clients);
            const result = await cmd.execute('say', ['hi']);
            expect(result).toBeNull();
        });

        it('routes to the selected client when multiple clients exist', async () => {
            const clients = [
                makeClientInfo('server1', false, 'wrong'),
                makeClientInfo('server2', true, 'correct'),
                makeClientInfo('server3', false, 'wrong'),
            ];
            const cmd = new ProxyPassCommand(clients);
            const result = await cmd.execute('list', []);
            expect(result).toBe('correct');
            expect(clients[0].client.send).not.toHaveBeenCalled();
            expect(clients[1].client.send).toHaveBeenCalled();
            expect(clients[2].client.send).not.toHaveBeenCalled();
        });
    });
});
