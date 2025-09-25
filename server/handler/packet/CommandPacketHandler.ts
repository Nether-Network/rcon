import { IPacketHandler } from './IPacketHandler';
import { ConnectedClient } from '../../ConnectedClient';
import { Packet, PacketType } from '@nether-network/rcon-common';
import { Server } from '../../Server';

export class CommandPacketHandler implements IPacketHandler {
    constructor(private server: Server) {}

    canHandle(packet: Packet): boolean {
        return packet.type === PacketType.EXECCOMMAND;
    }

    async handle(client: ConnectedClient, packet: Packet): Promise<void> {
        if (packet.data === null) {
            return;
        }

        const [command, ...args] = packet.data.split(' ');

        try {
            const result = await this.server.executeCommand(command, args);
            client.logger?.info('Executing command', { command, args, result });
            this.server.emit('command', { client, command, args });
            this.server.send(
                client,
                new Packet(packet.id, PacketType.RESPONSE_VALUE, result)
            );
        } catch (error) {
            const errorMessage = `Error: ${(error as Error).message}`;
            client.logger?.error('Command execution failed', {
                command,
                args,
                error,
            });
            this.server.send(
                client,
                new Packet(packet.id, PacketType.RESPONSE_VALUE, errorMessage)
            );
        }
    }
}
