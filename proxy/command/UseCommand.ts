import { ICommand } from '@nether-network/rcon-server';
import { ClientInfo } from '../Proxy';
import chalk from 'chalk';

export class UseCommand implements ICommand {
    constructor(private readonly clients: ClientInfo[]) {}

    getPriority(): number {
        return 50;
    }

    canHandle(command: string): boolean {
        return command === this.getName();
    }

    getName(): string {
        return 'use';
    }

    getDescription(): string {
        return 'Select a server to use: use <server_name>';
    }

    execute(_command: string, args: string[]): Promise<string | null> {
        if (args.length === 0) {
            return Promise.resolve(
                `Usage: ${chalk.gray.bold('use <server_name>')}`
            );
        }
        const serverName = args[0];
        const clientInfo = this.clients.find((c) => c.name === serverName);
        if (!clientInfo) {
            return Promise.resolve(`Server ${serverName} not found.`);
        }
        this.clients.forEach((c) => (c.selected = false));
        clientInfo.selected = true;
        return Promise.resolve(`Using server ${serverName}.`);
    }
}
