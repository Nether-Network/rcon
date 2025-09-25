import { ICommand } from '@nether-network/rcon-server';
import { ClientInfo } from '../Proxy';

export class ProxyPassCommand implements ICommand {
    constructor(private readonly clients: ClientInfo[]) {}
    getPriority(): number {
        return 110;
    }

    canHandle(_command: string): boolean {
        return true;
    }

    async execute(command: string, args: string[]): Promise<string | null> {
        const clientInfo = this.clients.find((c) => c.selected);
        if (!clientInfo) {
            return Promise.resolve(`No server selected.`);
        }
        return await clientInfo.client.send([command, ...args].join(' '));
    }
}
