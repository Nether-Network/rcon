import { ICommand } from '@nether-network/rcon-server';
import { ClientInfo } from '../Proxy';
import chalk from 'chalk';

export class StatusCommand implements ICommand {
    constructor(private readonly clients: ClientInfo[]) {}

    getPriority(): number {
        return 50;
    }

    canHandle(command: string): boolean {
        return command === this.getName();
    }

    getName(): string {
        return 'status';
    }

    getDescription(): string {
        return 'Show server status';
    }

    execute(_command: string, _args: string[]): Promise<string | null> {
        let text = '';
        for (const { name, selected, client } of this.clients) {
            if (text.length > 0) text += '\n';
            if (selected) {
                text += chalk.cyan('> ');
            } else {
                text += '  ';
            }
            text += `${chalk.gray.bold(name)}`;
            if (client.isConnected()) {
                if (client.isAuthenticated()) {
                    text += `: ${chalk.green('Online')}`;
                } else {
                    text += `: ${chalk.yellow('Authenticating')}`;
                }
            } else {
                text += `: ${chalk.red('Offline')}`;
            }
        }
        return Promise.resolve(text);
    }
}
