import chalk from 'chalk';
import { App } from '../App';
import { Tui } from '../Tui';
import { ICommand } from './ICommand';

export class StatusCommand implements ICommand {
    name = '#status';
    description = '#status                             Show current connection status';

    constructor(
        private readonly app: App,
        private readonly tui: Tui
    ) {}

    async execute(_args: string[]): Promise<void> {
        const client = this.app.getClient();
        const label = this.app.getConnectionLabel();

        if (client === null || label === null) {
            this.tui.print(chalk.yellow('Status: ') + chalk.red('disconnected'));
            return;
        }

        this.tui.print(
            [
                chalk.bold('Status:'),
                `  Server:        ${chalk.cyan(label)}`,
                `  Connected:     ${chalk.green('yes')}`,
                `  Authenticated: ${chalk.green(String(client.isAuthenticated()))}`,
            ].join('\n')
        );
    }
}
