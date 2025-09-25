const ANSI_RESET = '\x1b[0m';

const CODE_MAP: Record<string, string> = {
    // Colors
    '0': '\x1b[30m',   // Black
    '1': '\x1b[34m',   // Dark Blue
    '2': '\x1b[32m',   // Dark Green
    '3': '\x1b[36m',   // Dark Aqua
    '4': '\x1b[31m',   // Dark Red
    '5': '\x1b[35m',   // Dark Purple
    '6': '\x1b[33m',   // Gold
    '7': '\x1b[37m',   // Gray
    '8': '\x1b[90m',   // Dark Gray
    '9': '\x1b[94m',   // Blue
    a:   '\x1b[92m',   // Green
    b:   '\x1b[96m',   // Aqua
    c:   '\x1b[91m',   // Red
    d:   '\x1b[95m',   // Light Purple
    e:   '\x1b[93m',   // Yellow
    f:   '\x1b[97m',   // White
    // Styles
    k:   '',           // Obfuscated (not representable in terminals)
    l:   '\x1b[1m',    // Bold
    m:   '\x1b[9m',    // Strikethrough
    n:   '\x1b[4m',    // Underline
    o:   '\x1b[3m',    // Italic
    r:   ANSI_RESET,   // Reset
};

/**
 * Converts Minecraft formatting codes (§X) in a string to ANSI escape sequences.
 * Always appends a reset to prevent color bleed into subsequent output.
 */
export function formatMinecraft(text: string): string {
    const converted = text.replace(/(§|B')([0-9a-fklmnorA-FKLMNOR])/g, (_text, _type, code: string) => {
        return CODE_MAP[code.toLowerCase()] ?? '';
    });
    return converted + ANSI_RESET;
}
