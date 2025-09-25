import chalk from 'chalk';
import { Client } from '@nether-network/rcon-client';
import {
    AuthenticationError,
    ConnectionError,
    TimeoutError,
} from '@nether-network/rcon-common';
import { Tui } from './Tui';
import { formatMinecraft } from './MinecraftFormatter';
import { CommandRegistry } from './command/CommandRegistry';
import { ConnectCommand } from './command/ConnectCommand';
import { DisconnectCommand } from './command/DisconnectCommand';
import { HelpCommand } from './command/HelpCommand';
import { HistoryCommand } from './command/HistoryCommand';
import { QuitCommand } from './command/QuitCommand';
import { StatusCommand } from './command/StatusCommand';

export interface AppOptions {
    host?: string;
    port?: number;
    password?: string;
}

export class App {
    private client: Client | null = null;
    private connectionLabel: string | null = null;
    private commandHistory: string[] = [];
    private readonly registry: CommandRegistry;

    constructor(
        private readonly tui: Tui,
        private readonly options: AppOptions | null,
    ) {
        this.registry = new CommandRegistry();
        this.registry.register(
            new ConnectCommand(this, tui),
            new DisconnectCommand(this),
            new HelpCommand(this.registry, tui),
            new StatusCommand(this, tui),
            new HistoryCommand(this, tui),
            new QuitCommand(this),
        );
    }

    async start(): Promise<void> {
        this.printBanner();

        if (this.options !== null) {
            const host = this.options.host ?? 'localhost';
            const port = this.options.port ?? 25575;
            const password = this.options.password ?? '';
            try {
                await this.connect(host, port, password);
            } catch (err) {
                this.printError(err);
            }
        }

        // eslint-disable-next-line no-constant-condition
        while (true) {
            const input = await this.tui.prompt(this.buildPrompt());
            if (input === '') continue;

            this.commandHistory.push(input);
            if (this.commandHistory.length > 100) {
                this.commandHistory.shift();
            }

            const parts = input.split(/\s+/);
            const token = parts[0];
            const args = parts.slice(1);

            if (token.startsWith('#')) {
                const cmd = this.registry.find(token.toLowerCase());
                if (cmd) {
                    try {
                        await cmd.execute(args);
                    } catch (err) {
                        this.tui.print(
                            chalk.red(`Error: ${(err as Error).message}`),
                        );
                    }
                } else {
                    this.tui.print(
                        chalk.red(
                            `Unknown command: ${token}. Type #help for available commands.`,
                        ),
                    );
                }
            } else {
                await this.rconExecute(input);
            }
        }
    }

    async connect(host: string, port: number, password: string): Promise<void> {
        if (this.client !== null) {
            const old = this.client;
            this.client = null;
            this.connectionLabel = null;
            await old.close();
        }

        const newClient = new Client({
            uri: { host, port, password, tls: false },
        });

        newClient.on('disconnected', () => {
            // Only react to unexpected server-side disconnects.
            // When we intentionally disconnect, we null out this.client first,
            // so this check avoids double-handling.
            if (this.client === newClient) {
                this.tui.print(chalk.yellow('\nServer disconnected.'));
                this.client = null;
                this.connectionLabel = null;
            }
        });

        newClient.on('error', (err) => {
            this.tui.print(chalk.red(`\nConnection error: ${err.message}`));
        });

        this.tui.print(chalk.gray(`Connecting to ${host}:${port}...`));
        await newClient.connect();
        this.client = newClient;
        this.connectionLabel = `${host}:${port}`;
        this.tui.print(
            chalk.green(`Connected and authenticated to ${this.connectionLabel}.`),
        );
    }

    async disconnect(): Promise<void> {
        if (this.client === null) {
            this.tui.print(chalk.yellow('Not connected.'));
            return;
        }
        const client = this.client;
        this.client = null;
        this.connectionLabel = null;
        await client.close();
        this.tui.print(chalk.yellow('Disconnected.'));
    }

    async quit(): Promise<void> {
        if (this.client !== null) {
            const client = this.client;
            this.client = null;
            this.connectionLabel = null;
            await client.close();
        }
        this.tui.close();
        process.exit(0);
    }

    getClient(): Client | null {
        return this.client;
    }

    getConnectionLabel(): string | null {
        return this.connectionLabel;
    }

    getHistory(): string[] {
        return [...this.commandHistory];
    }

    private async rconExecute(input: string): Promise<void> {
        if (this.client === null || !this.client.isAuthenticated()) {
            this.tui.print(
                chalk.red('Not connected. Use #connect to connect first.'),
            );
            return;
        }
        try {
            const response = await this.client.send(input);
            if (response === null || response.trim() === '') {
                this.tui.print(chalk.gray('(no response)'));
            } else {
                this.tui.print(formatMinecraft(response));
            }
        } catch (err) {
            if (err instanceof TimeoutError) {
                this.tui.print(
                    chalk.red(`Command timed out: ${(err as Error).message}`),
                );
            } else {
                this.tui.print(chalk.red(`Error: ${(err as Error).message}`));
            }
        }
    }

    private buildPrompt(): string {
        if (this.connectionLabel !== null) {
            return (
                chalk.cyan('[') +
                chalk.yellow(this.connectionLabel) +
                chalk.cyan(']') +
                chalk.green('> ')
            );
        }
        return (
            chalk.cyan('[') +
            chalk.red('disconnected') +
            chalk.cyan(']') +
            chalk.white('> ')
        );
    }

    private printBanner(): void {
        const banner = [
            '██████╗  ██████╗ ██████╗ ███╗   ██╗',
            '██╔══██╗██╔════╝██╔═══██╗████╗  ██║',
            '██████╔╝██║     ██║   ██║██╔██╗ ██║',
            '██╔══██╗██║     ██║   ██║██║╚██╗██║',
            '██║  ██║╚██████╗╚██████╔╝██║ ╚████║',
            '╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝'
        ];
        this.tui.print('');
        banner.forEach(line => this.tui.print(chalk.bold.cyan(line)));
        this.tui.print(chalk.gray('A simple RCON client for Minecraft servers by github.com/Nether-Network'));
        this.tui.print('');
        this.tui.print(chalk.gray('Type #help for available commands.'));
        this.tui.print('');
    }

    private printError(err: unknown): void {
        if (err instanceof AuthenticationError) {
            this.tui.print(
                chalk.red(`Authentication failed: ${(err as Error).message}`),
            );
        } else if (err instanceof ConnectionError) {
            this.tui.print(
                chalk.red(`Connection failed: ${(err as Error).message}`),
            );
        } else {
            this.tui.print(chalk.red(`Error: ${(err as Error).message}`));
        }
    }
}
