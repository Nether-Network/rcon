import { CommandRegistry } from './CommandRegistry';
import { ICommand } from './ICommand';

function makeCommand(opts: {
    name: string;
    priority?: number;
    handles?: string[];
    response?: string | null;
}): ICommand {
    const executeResponse = 'response' in opts ? opts.response : `response:${opts.name}`;
    return {
        getPriority: () => opts.priority ?? 50,
        canHandle: (cmd: string) =>
            (opts.handles ?? [opts.name]).includes(cmd),
        getName: () => opts.name,
        getDescription: () => `Description for ${opts.name}`,
        execute: jest.fn().mockResolvedValue(executeResponse),
    };
}

describe('CommandRegistry', () => {
    let registry: CommandRegistry;

    beforeEach(() => {
        registry = new CommandRegistry();
    });

    describe('registerCommand', () => {
        it('should register a single command', () => {
            const cmd = makeCommand({ name: 'foo' });
            registry.registerCommand(cmd);
            expect(registry.getAllCommands()).toContain(cmd);
        });

        it('should register multiple commands via variadic args', () => {
            const a = makeCommand({ name: 'a' });
            const b = makeCommand({ name: 'b' });
            registry.registerCommand(a, b);
            const all = registry.getAllCommands();
            expect(all).toContain(a);
            expect(all).toContain(b);
        });

        it('should register commands across multiple calls', () => {
            const a = makeCommand({ name: 'a' });
            const b = makeCommand({ name: 'b' });
            registry.registerCommand(a);
            registry.registerCommand(b);
            expect(registry.getAllCommands().length).toBe(2);
        });
    });

    describe('getAllCommands', () => {
        it('should return empty array when no commands registered', () => {
            expect(registry.getAllCommands()).toEqual([]);
        });

        it('should return commands sorted by priority ascending', () => {
            const high = makeCommand({ name: 'high', priority: 10 });
            const low = makeCommand({ name: 'low', priority: 100 });
            registry.registerCommand(low, high);
            const all = registry.getAllCommands();
            expect(all[0]).toBe(high);
            expect(all[1]).toBe(low);
        });

        it('should handle commands with equal priority without error', () => {
            const a = makeCommand({ name: 'a', priority: 50 });
            const b = makeCommand({ name: 'b', priority: 50 });
            registry.registerCommand(a, b);
            expect(registry.getAllCommands().length).toBe(2);
        });
    });

    describe('getCommand', () => {
        it('should return the command that canHandle the name', () => {
            const cmd = makeCommand({ name: 'test' });
            registry.registerCommand(cmd);
            expect(registry.getCommand('test')).toBe(cmd);
        });

        it('should return null when no command handles the name', () => {
            const cmd = makeCommand({ name: 'test' });
            registry.registerCommand(cmd);
            expect(registry.getCommand('unknown')).toBeNull();
        });

        it('should be case-insensitive (lowercases input before matching)', () => {
            const cmd = makeCommand({ name: 'foo', handles: ['foo'] });
            registry.registerCommand(cmd);
            expect(registry.getCommand('FOO')).toBe(cmd);
        });

        it('should return highest-priority command when multiple can handle the same name', () => {
            const preferred = makeCommand({ name: 'x', priority: 10, handles: ['x'] });
            const fallback = makeCommand({ name: 'x-fallback', priority: 100, handles: ['x'] });
            registry.registerCommand(fallback, preferred);
            expect(registry.getCommand('x')).toBe(preferred);
        });
    });

    describe('executeCommand', () => {
        it('should call execute() on the matched command with name and args', async () => {
            const cmd = makeCommand({ name: 'greet' });
            registry.registerCommand(cmd);
            await registry.executeCommand('greet', ['world']);
            expect(cmd.execute).toHaveBeenCalledWith('greet', ['world']);
        });

        it('should return the command response string', async () => {
            const cmd = makeCommand({ name: 'ping', response: 'pong' });
            registry.registerCommand(cmd);
            const result = await registry.executeCommand('ping', []);
            expect(result).toBe('pong');
        });

        it('should return unknown-command message when no command matches', async () => {
            const result = await registry.executeCommand('nosuchcmd', []);
            expect(result).toContain('Unknown command: nosuchcmd');
        });

        it('should return null when command.execute resolves with null', async () => {
            const cmd = makeCommand({ name: 'nothing', response: null });
            registry.registerCommand(cmd);
            const result = await registry.executeCommand('nothing', []);
            expect(result).toBeNull();
        });

        it('should throw wrapped error when execute throws', async () => {
            const cmd = makeCommand({ name: 'bad' });
            (cmd.execute as jest.Mock).mockRejectedValue(new Error('boom'));
            registry.registerCommand(cmd);
            await expect(registry.executeCommand('bad', [])).rejects.toThrow(
                /Error executing command/
            );
        });
    });
});
