import { Packet } from '@nether-network/rcon-common';
import { ConnectedClient } from '../../ConnectedClient';

/**
 * Strategy interface for handling RCON packets received from connected clients.
 *
 * Packet handlers are tried in registration order; the first handler whose
 * canHandle() returns true processes the packet exclusively.
 */
export interface IPacketHandler {
    /**
     * Returns true if this handler is responsible for the given packet.
     *
     * @param packet - The incoming packet to inspect
     * @returns true if this handler should process the packet
     */
    canHandle(packet: Packet): boolean;

    /**
     * Processes the packet on behalf of the connected client.
     *
     * @param client - The client that sent the packet
     * @param packet - The packet to process
     * @returns Promise that resolves when handling is complete
     */
    handle(client: ConnectedClient, packet: Packet): Promise<void>;
}
