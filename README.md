# Nether Network RCON

A comprehensive RCON (Remote Console) implementation for managing multiple Minecraft servers with client, server, and proxy components built in TypeScript.

## 🚀 Features

- **RCON Client**: Connect to and send commands to RCON-enabled servers
- **RCON Server**: Host your own RCON server with customisable authentication and commands
- **RCON Proxy**: Manage multiple Minecraft servers through a single RCON interface
- **Interactive CLI**: Terminal client with coloured Minecraft output, connection wizard, and command history
- **TypeScript**: Full type safety and modern JavaScript features
- **Extensible**: Plugin-based architecture for custom commands and authentication handlers

## 📦 Packages

This is a monorepo containing the following workspace packages:

| Package                                   | Description                                                       |
|-------------------------------------------|-------------------------------------------------------------------|
| [`@nether-network/rcon-common`](./common) | Shared protocol, packet parsing, config validation, and utilities |
| [`@nether-network/rcon-client`](./client) | RCON client implementation                                        |
| [`@nether-network/rcon-server`](./server) | RCON server implementation                                        |
| [`@nether-network/rcon-proxy`](./proxy)   | Multi-server RCON proxy                                           |
| [`@nether-network/rcon-cli`](./cli)       | Interactive RCON terminal client                                  |

## 🛠️ Development Setup

```bash
git clone https://github.com/Nether-Network/rcon.git
cd rcon
npm install
npm run build  # build all packages
npm test       # test all packages
```

## 📖 Usage

### RCON Client

```typescript
import { Client } from '@nether-network/rcon-client';

const client = new Client({
    uri: {
        host: '127.0.0.1',
        port: 25575,
        password: 'mypassword',
        tls: false,
    }
});

await client.connect();
const response = await client.send('list');
console.log(response);
```

### RCON Server

```typescript
import { Server } from '@nether-network/rcon-server';
import { PasswordAuthHandler } from '@nether-network/rcon-server';

const server = new Server({
    host: '127.0.0.1',
    port: 25575,
    authHandlers: [new PasswordAuthHandler('mypassword')]
});

await server.start();
```

### RCON Proxy

```typescript
import { Proxy } from '@nether-network/rcon-proxy';

const proxy = new Proxy({
    host: '127.0.0.1',
    port: 25575,
    servers: [
        { name: 'survival', host: '127.0.0.1', port: 25576, password: 'pass1' },
        { name: 'creative', host: '127.0.0.1', port: 25577, password: 'pass2' }
    ]
});

await proxy.start();
```

Once connected to the proxy via any RCON client, the following built-in commands are available:

- `status` — show all backend servers and their connection state
- `use <server>` — switch to a named server
- Any other command is forwarded to the currently selected server

### RCON CLI

```bash
# Interactive mode (connection wizard)
npx @nether-network/rcon-cli

# Direct connection
npx @nether-network/rcon-cli --host 127.0.0.1 --port 25575 --password mypassword
```

Once running, the following built-in commands are available (prefixed with `#`):

- `#connect [host] [port] [password]` — connect to an RCON server (launches wizard if no args given)
- `#disconnect` — close the current connection
- `#status` — show current connection state
- `#history` — show recent command history
- `#help` — list available commands
- `#quit` — exit the application
- Any other input is forwarded as an RCON command to the connected server

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests for a single package
cd client && npm test
```

## 🚧 Roadmap

- [ ] 100% test coverage
- [ ] TLS/SSL support (not officially supported by Minecraft but useful for custom servers)
- [ ] Web-based management interface
- [ ] Metrics and monitoring
- [ ] Rate limiting and throttling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes
4. Push to the branch and open a Pull Request

## 📄 License

This project is licensed under the BSD 3-Clause License.  
See the LICENSE file for details.

## 🐛 Issues

Report bugs and feature requests on [GitHub Issues](https://github.com/Nether-Network/rcon/issues).

---

Made with ❤️ by the Nether Network team
