import { ICommand } from './ICommand';

export class CommandRegistry {
    private commands: ICommand[] = [];

    registerCommand(...commands: ICommand[]): void {
        for (const command of commands) {
            this.commands.push(command);
        }
    }

    getAllCommands(): ICommand[] {
        return this.commands.sort(
            (commandA, commandB) =>
                commandA.getPriority() - commandB.getPriority()
        );
    }

    getCommand(name: string): ICommand | null {
        name = name.toLowerCase();

        for (const command of this.getAllCommands()) {
            if (command.canHandle(name)) {
                return command;
            }
        }

        return null;
    }

    async executeCommand(name: string, args: string[]): Promise<string | null> {
        const command = this.getCommand(name);

        if (!command) {
            return `Unknown command: ${name}. Type '#help' for available commands.`;
        }

        try {
            return await command.execute(name, args);
        } catch (error) {
            throw new Error(
                `Error executing command '${name}': ${(error as Error).message}`
            );
        }
    }
}
