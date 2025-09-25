export interface ICommand {
    name: string;
    aliases?: string[];
    description: string;
    execute(args: string[]): Promise<void>;
}
