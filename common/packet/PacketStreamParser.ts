import { Packet } from '../protocol/Packet';
import { Logger } from 'winston';

/**
 * Handles buffering and parsing of RCON packet streams.
 * Extracts duplicate logic previously found in both Client and Server.
 *
 * Follows the Single Responsibility Principle by focusing solely on
 * packet stream parsing and buffer management.
 */
export class PacketStreamParser {
    private buffer: Buffer = Buffer.alloc(0);

    constructor(private readonly logger?: Logger | null) {}

    /**
     * Appends incoming data to the internal buffer and extracts complete packets.
     *
     * @param data - Raw data received from socket
     * @returns Array of successfully parsed packets
     */
    appendData(data: Buffer): Packet[] {
        this.buffer = Buffer.concat([this.buffer, data]);

        const packets: Packet[] = [];

        while (this.buffer.length >= 4) {
            // Read the packet length from the first 4 bytes
            const packetLength = this.buffer.readInt32LE();

            // Check if we have received the complete packet
            if (4 + packetLength > this.buffer.length) {
                // Not enough data yet, wait for more
                break;
            }

            // Extract packet data (excluding the length prefix)
            const packetData = this.buffer.slice(4, 4 + packetLength);

            // Remove processed packet from buffer
            this.buffer = this.buffer.slice(4 + packetLength);

            try {
                const packet = Packet.fromBuffer(packetData);
                packets.push(packet);
            } catch (error) {
                this.logger?.error('Failed to parse packet', {
                    error,
                    packetData: packetData.toString('hex'),
                    packetLength,
                });
                // Continue processing remaining packets even if one fails
            }
        }

        return packets;
    }

    /**
     * Resets the internal buffer, discarding any incomplete packet data.
     * Useful when closing a connection or recovering from errors.
     */
    reset(): void {
        this.buffer = Buffer.alloc(0);
    }

    /**
     * Returns the current size of the internal buffer.
     * Useful for debugging or monitoring buffer growth.
     */
    getBufferSize(): number {
        return this.buffer.length;
    }

    /**
     * Checks if there's any data in the buffer.
     * Useful for detecting incomplete packets when closing connections.
     */
    hasBufferedData(): boolean {
        return this.buffer.length > 0;
    }
}
