import chalk from 'chalk';
import { CommandRegistry } from './CommandRegistry';
import { ICommand } from './ICommand';
import { Tui } from '../Tui';

export class HelpCommand implements ICommand {
    name = '#help';
    description = '#help                               Show this help message';

    constructor(
        private readonly registry: CommandRegistry,
        private readonly tui: Tui
    ) {}

    async execute(_args: string[]): Promise<void> {
        this.tui.print(chalk.bold('Available commands:'));
        for (const cmd of this.registry.all()) {
            this.tui.print('  ' + chalk.yellow(cmd.description));
        }
        this.tui.print('');
        this.tui.print(chalk.gray('Any other input is sent as an RCON command to the server.'));
    }
}
