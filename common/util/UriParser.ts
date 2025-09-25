export interface Uri {
    host: string;
    port: number | null;
    password: string | null;
    tls: boolean;
}

export function parseUri(input: string): Uri {
    if (!input) {
        throw new Error('Empty URI');
    }

    let tls = false;
    let working = input;

    if (/^tls:\/\//i.test(working)) {
        tls = true;
        working = working.replace(/^tls:\/\//i, '');
    }

    let password: string | null = null;
    let hostPort: string;

    const atParts = working.split('@');
    if (atParts.length > 2) {
        throw new Error('Invalid URI: multiple @');
    }
    if (atParts.length === 2) {
        password = atParts[0];
        hostPort = atParts[1];
        if (!hostPort) {
            throw new Error('Invalid URI: missing host');
        }
    } else {
        hostPort = working;
    }

    const colonParts = hostPort.split(':');
    if (colonParts.length > 2) {
        throw new Error('Invalid URI: multiple colons');
    }

    const host = colonParts[0];
    if (!host) {
        throw new Error('Invalid URI: missing host');
    }

    if (!/^[A-Za-z0-9._-]+$/.test(host)) {
        throw new Error('Invalid host');
    }

    let port: number | null = null;
    if (colonParts.length === 2) {
        const portStr = colonParts[1];
        if (!/^[0-9]+$/.test(portStr)) {
            throw new Error('Invalid port');
        }
        port = parseInt(portStr, 10);
        if (port <= 0 || port > 65535) {
            throw new Error('Port out of range');
        }
    }

    return { host, port, password, tls };
}
