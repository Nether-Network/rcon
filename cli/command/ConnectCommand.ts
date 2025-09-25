import chalk from 'chalk';
import {
    AuthenticationError,
    ConnectionError,
    TimeoutError,
} from '@nether-network/rcon-common';
import { App } from '../App';
import { Tui } from '../Tui';
import { ICommand } from './ICommand';

export class ConnectCommand implements ICommand {
    name = '#connect';
    description = '#connect [host] [port] [password]  Connect to an RCON server';

    constructor(
        private readonly app: App,
        private readonly tui: Tui
    ) {}

    async execute(args: string[]): Promise<void> {
        let host: string;
        let port: number;
        let password: string;

        if (args.length >= 3) {
            host = args[0];
            port = parseInt(args[1], 10);
            password = args[2];

            if (isNaN(port) || port < 1 || port > 65535) {
                this.tui.print(chalk.red('Invalid port: must be a number between 1 and 65535.'));
                return;
            }
        } else {
            const result = await this.tui.wizard();
            if (result === null) {
                this.tui.print(chalk.gray('Cancelled.'));
                return;
            }
            ({ host, port, password } = result);
        }

        try {
            await this.app.connect(host, port, password);
        } catch (err) {
            if (err instanceof AuthenticationError) {
                this.tui.print(chalk.red(`Authentication failed: ${(err as Error).message}`));
            } else if (err instanceof ConnectionError) {
                this.tui.print(chalk.red(`Connection failed: ${(err as Error).message}`));
            } else if (err instanceof TimeoutError) {
                this.tui.print(chalk.red(`Connection timed out: ${(err as Error).message}`));
            } else {
                this.tui.print(chalk.red(`Error: ${(err as Error).message}`));
            }
        }
    }
}
