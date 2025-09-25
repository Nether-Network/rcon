/**
 * Interface for server-side RCON commands.
 *
 * Commands are registered with the CommandRegistry and dispatched by name.
 * Priority controls evaluation order when multiple commands could match.
 */
export interface ICommand {
    /**
     * Returns the evaluation priority for this command.
     * Lower values are evaluated first. Use high values (e.g. 110) for
     * catch-all / pass-through commands.
     *
     * @returns A numeric priority value
     */
    getPriority(): number;

    /**
     * Returns true if this command handles the given command name.
     *
     * @param command - The lowercased command string from the client
     * @returns true if this command should handle the input
     */
    canHandle(command: string): boolean;

    /**
     * Returns the canonical name of this command, used by the help system.
     * Optional — commands without a name are hidden from help output.
     *
     * @returns The command name string
     */
    getName?(): string;

    /**
     * Returns a human-readable description shown in help output.
     * Optional — only displayed when getName() is also implemented.
     *
     * @returns The description string
     */
    getDescription?(): string;

    /**
     * Executes the command and returns a response string.
     *
     * @param command - The command name as entered by the client
     * @param args - Space-separated arguments that follow the command name
     * @returns Promise that resolves with the response string, or null for no output
     */
    execute(command: string, args: string[]): Promise<string | null>;
}
