import { Logger } from 'winston';
import { PacketStreamParser, ISocket } from '@nether-network/rcon-common';

/**
 * Represents a client that is currently connected to the RCON server.
 *
 * This interface carries both the connection state and the per-client
 * infrastructure (packet parser, logger) that handlers need.
 */
export interface ConnectedClient {
    /** Unique identifier assigned when the connection is accepted */
    id: string;
    /** Abstracted socket for reading and writing raw bytes */
    socket: ISocket;
    /** Whether this client has successfully authenticated */
    authenticated: boolean;
    /** Stateful stream parser that reassembles fragmented RCON packets */
    packetParser: PacketStreamParser;
    /** Optional per-client logger (child logger scoped to the client ID) */
    logger: Logger | null;
    /** Arbitrary metadata that auth/packet handlers can attach to a client */
    extra: { [key: string]: any };
}
