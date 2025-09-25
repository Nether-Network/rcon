import { IPacketHandler } from './IPacketHandler';
import { Packet, PacketType } from '@nether-network/rcon-common';
import { ConnectedClient } from '../../ConnectedClient';
import { Server } from '../../Server';

export class AuthPacketHandler implements IPacketHandler {
    constructor(private server: Server) {}

    canHandle(packet: Packet): boolean {
        return packet.type === PacketType.AUTH;
    }

    async handle(client: ConnectedClient, packet: Packet): Promise<void> {
        if (client.authenticated) {
            this.server.send(
                client,
                AuthPacketHandler.createAuthResponsePacket(true, packet)
            );
            return;
        }
        const password = packet.data ?? '';
        const result = await this.server.authenticate(password);
        client.logger?.info('Login', { result });
        this.server.emit('login', { client, result, password });
        if (result) {
            client.authenticated = true;
            this.server.send(
                client,
                AuthPacketHandler.createAuthResponsePacket(true, packet)
            );
            return;
        }
        this.server.send(
            client,
            AuthPacketHandler.createAuthResponsePacket(false, packet)
        );
    }

    private static createAuthResponsePacket(
        result: boolean,
        packet: Packet
    ): Packet {
        return result
            ? new Packet(packet.id, PacketType.AUTH_RESPONSE)
            : new Packet(-1, PacketType.AUTH_RESPONSE);
    }
}
