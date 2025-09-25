import * as readline from 'readline';

export class Tui {
    private rl: readline.Interface;

    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        this.rl.on('close', () => process.exit(0));
    }

    prompt(label: string): Promise<string> {
        return new Promise((resolve) => {
            this.rl.question(label, (answer) => {
                resolve(answer.trim());
            });
        });
    }

    print(message: string): void {
        process.stdout.write(message + '\n');
    }

    async wizard(): Promise<{ host: string; port: number; password: string } | null> {
        const host = await this.prompt('  Host: ');
        if (host === '') {
            return null;
        }

        const portStr = await this.prompt('  Port [25575]: ');
        const port = portStr === '' ? 25575 : parseInt(portStr, 10);
        if (isNaN(port) || port < 1 || port > 65535) {
            this.print('  Invalid port number.');
            return null;
        }

        const password = await this.prompt('  Password: ');

        return { host, port, password };
    }

    close(): void {
        this.rl.close();
    }
}
