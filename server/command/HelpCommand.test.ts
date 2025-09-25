// boxen uses ESM — mock it to avoid transform issues in Jest
jest.mock('boxen', () => (text: string) => text);

import { HelpCommand } from './HelpCommand';
import { CommandRegistry } from './CommandRegistry';
import { ICommand } from './ICommand';

function makeNamedCommand(name: string, description?: string): ICommand {
    return {
        getPriority: () => 50,
        canHandle: (cmd) => cmd === name,
        getName: () => name,
        getDescription: description ? () => description : undefined,
        execute: jest.fn().mockResolvedValue(null),
    };
}

function makeUnnamedCommand(): ICommand {
    return {
        getPriority: () => 50,
        canHandle: () => false,
        execute: jest.fn().mockResolvedValue(null),
    };
}

describe('HelpCommand', () => {
    let registry: CommandRegistry;

    beforeEach(() => {
        registry = new CommandRegistry();
    });

    describe('metadata', () => {
        it('should return priority 100', () => {
            const help = new HelpCommand(registry, '', false);
            expect(help.getPriority()).toBe(100);
        });

        it('should return "help" as name with empty prefix', () => {
            const help = new HelpCommand(registry, '', false);
            expect(help.getName()).toBe('help');
        });

        it('should return prefixed name when prefix is set', () => {
            const help = new HelpCommand(registry, '#', false);
            expect(help.getName()).toBe('#help');
        });

        it('should return a non-empty description', () => {
            const help = new HelpCommand(registry, '', false);
            expect(typeof help.getDescription()).toBe('string');
            expect(help.getDescription().length).toBeGreaterThan(0);
        });
    });

    describe('canHandle', () => {
        it('should return true for "help"', () => {
            const help = new HelpCommand(registry, '', false);
            expect(help.canHandle('help')).toBe(true);
        });

        it('should return true for "?" with empty prefix', () => {
            const help = new HelpCommand(registry, '', false);
            expect(help.canHandle('?')).toBe(true);
        });

        it('should return true for prefixed "?" when prefix is set', () => {
            const help = new HelpCommand(registry, '#', false);
            expect(help.canHandle('#?')).toBe(true);
        });

        it('should return false for unrelated command strings', () => {
            const help = new HelpCommand(registry, '', false);
            expect(help.canHandle('list')).toBe(false);
        });

        it('should return false for partial matches like "helpers"', () => {
            const help = new HelpCommand(registry, '', false);
            expect(help.canHandle('helpers')).toBe(false);
        });
    });

    describe('execute (includeBox: false)', () => {
        it('should return empty string when registry has no commands', async () => {
            const help = new HelpCommand(registry, '', false);
            const result = await help.execute('help', []);
            expect(result).toBe('');
        });

        it('should include command name and description in output', async () => {
            registry.registerCommand(makeNamedCommand('kick', 'Kick a player'));
            const help = new HelpCommand(registry, '', false);
            const result = await help.execute('help', []);
            expect(result).toContain('kick');
            expect(result).toContain('Kick a player');
        });

        it('should omit commands without getName method', async () => {
            registry.registerCommand(makeUnnamedCommand());
            registry.registerCommand(makeNamedCommand('visible'));
            const help = new HelpCommand(registry, '', false);
            const result = await help.execute('help', []);
            expect(result).toBeTruthy();
            expect(result!).toContain('visible');
            // The unnamed command has no getName, so nothing extra appears
            expect(result!.split('\n').filter(Boolean).length).toBe(1);
        });

        it('should include commands that have getName but no getDescription', async () => {
            registry.registerCommand(makeNamedCommand('nodesc'));
            const help = new HelpCommand(registry, '', false);
            const result = await help.execute('help', []);
            expect(result).toContain('nodesc');
        });

        it('should list commands in priority order', async () => {
            const low = { ...makeNamedCommand('low'), getPriority: () => 100 };
            const high = { ...makeNamedCommand('high'), getPriority: () => 10 };
            registry.registerCommand(low, high);
            const help = new HelpCommand(registry, '', false);
            const result = await help.execute('help', []);
            expect(result!.indexOf('high')).toBeLessThan(result!.indexOf('low'));
        });
    });

    describe('execute (includeBox: true)', () => {
        it('should wrap output with boxen but still contain command names', async () => {
            registry.registerCommand(makeNamedCommand('mycommand', 'My desc'));
            const help = new HelpCommand(registry, '', true);
            const result = await help.execute('help', []);
            expect(result).toContain('mycommand');
        });
    });
});
