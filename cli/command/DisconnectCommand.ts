import { App } from '../App';
import { ICommand } from './ICommand';

export class DisconnectCommand implements ICommand {
    name = '#disconnect';
    description = '#disconnect                         Disconnect from the current server';

    constructor(private readonly app: App) {}

    async execute(_args: string[]): Promise<void> {
        await this.app.disconnect();
    }
}
