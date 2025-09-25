import { ICommand } from './ICommand';
import { CommandRegistry } from './CommandRegistry';
import boxen from 'boxen';
import chalk from 'chalk';

export class HelpCommand implements ICommand {
    constructor(
        private readonly registry: CommandRegistry,
        private readonly prefix: string = '',
        private readonly includeBox: boolean = true
    ) {}

    getPriority(): number {
        return 100;
    }

    canHandle(command: string): boolean {
        return command === this.getName() || command === `${this.prefix}?`;
    }

    getName(): string {
        return `${this.prefix}help`;
    }

    getDescription(): string {
        return 'Shows this help message.';
    }

    execute(_command: string, _args: string[]): Promise<string | null> {
        let text = '';
        for (const handler of this.registry.getAllCommands()) {
            if (handler.getName === undefined) continue;
            if (text.length > 0) text += '\n';
            text += `${chalk.yellow(handler.getName())}`;
            if (handler.getDescription) {
                text += `: ${chalk.gray(handler.getDescription())}`;
            }
        }
        if (!this.includeBox) return Promise.resolve(text);
        return Promise.resolve(
            boxen(text, {
                title: 'Help: Available Commands',
            })
        );
    }
}
