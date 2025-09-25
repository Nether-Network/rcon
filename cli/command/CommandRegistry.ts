import { ICommand } from './ICommand';

export class CommandRegistry {
    private commands: ICommand[] = [];

    register(...commands: ICommand[]): void {
        this.commands.push(...commands);
    }

    find(token: string): ICommand | undefined {
        return this.commands.find(
            (cmd) =>
                cmd.name === token ||
                (cmd.aliases !== undefined && cmd.aliases.includes(token))
        );
    }

    all(): ICommand[] {
        return [...this.commands];
    }
}
