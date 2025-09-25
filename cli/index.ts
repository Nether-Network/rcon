import { Command, InvalidArgumentError } from 'commander';
import chalk from 'chalk';
import { Tui } from './Tui';
import { App, AppOptions } from './App';

function parsePort(value: string): number {
    const n = parseInt(value, 10);
    if (isNaN(n) || n < 1 || n > 65535) {
        throw new InvalidArgumentError('Port must be a number between 1 and 65535.');
    }
    return n;
}

function parseArgs(): AppOptions | null {
    const program = new Command();
    program
        .name('rcon-cli')
        .description('Interactive RCON client for Minecraft servers')
        .option('--host <host>', 'Server hostname or IP address')
        .option('--port <port>', 'Server RCON port', parsePort)
        .option('--password <password>', 'RCON password')
        .parse(process.argv);

    const opts = program.opts<{ host?: string; port?: number; password?: string }>();

    if (opts.host === undefined && opts.port === undefined && opts.password === undefined) {
        return null;
    }

    return {
        host: opts.host,
        port: opts.port,
        password: opts.password,
    };
}

async function main(): Promise<void> {
    const tui = new Tui();
    try {
        const options = parseArgs();
        const app = new App(tui, options);
        await app.start();
    } catch (err) {
        tui.print(chalk.red.bold(`Fatal: ${(err as Error).message}`));
        process.exit(1);
    }
}

main();
