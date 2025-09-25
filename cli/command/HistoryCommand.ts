import chalk from 'chalk';
import { App } from '../App';
import { Tui } from '../Tui';
import { ICommand } from './ICommand';

export class HistoryCommand implements ICommand {
    name = '#history';
    description = '#history [n]                        Show the last N sent commands (default 20)';

    constructor(
        private readonly app: App,
        private readonly tui: Tui
    ) {}

    async execute(args: string[]): Promise<void> {
        const history = this.app.getHistory();
        const n = args[0] !== undefined ? parseInt(args[0], 10) : 20;

        if (isNaN(n) || n < 1) {
            this.tui.print(chalk.red('Invalid argument: n must be a positive number.'));
            return;
        }

        const slice = history.slice(-n);
        if (slice.length === 0) {
            this.tui.print(chalk.gray('No history.'));
            return;
        }

        const start = history.length - slice.length + 1;
        this.tui.print(
            slice
                .map((cmd, i) => chalk.gray(`${start + i}.`) + ' ' + cmd)
                .join('\n')
        );
    }
}
