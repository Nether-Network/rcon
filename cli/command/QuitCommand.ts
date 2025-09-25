import { App } from '../App';
import { ICommand } from './ICommand';

export class QuitCommand implements ICommand {
    name = '#quit';
    aliases = ['#exit'];
    description = '#quit / #exit                       Exit the application';

    constructor(private readonly app: App) {}

    async execute(_args: string[]): Promise<void> {
        await this.app.quit();
    }
}
