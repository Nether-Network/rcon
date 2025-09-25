import { PacketStreamParser } from './PacketStreamParser';
import { Packet } from '../protocol/Packet';
import { PacketType } from '../protocol/PacketType';

describe('PacketStreamParser', () => {
    let parser: PacketStreamParser;

    beforeEach(() => {
        parser = new PacketStreamParser();
    });

    describe('appendData', () => {
        it('should parse a complete packet', () => {
            const packet = new Packet(1, PacketType.EXECCOMMAND, 'test');
            const buffer = packet.toBuffer();

            const packets = parser.appendData(buffer);

            expect(packets).toHaveLength(1);
            expect(packets[0].id).toBe(1);
            expect(packets[0].type).toBe(PacketType.EXECCOMMAND);
            expect(packets[0].data).toBe('test');
        });

        it('should handle multiple complete packets in one buffer', () => {
            const packet1 = new Packet(1, PacketType.EXECCOMMAND, 'first');
            const packet2 = new Packet(2, PacketType.EXECCOMMAND, 'second');
            const buffer = Buffer.concat([
                packet1.toBuffer(),
                packet2.toBuffer(),
            ]);

            const packets = parser.appendData(buffer);

            expect(packets).toHaveLength(2);
            expect(packets[0].id).toBe(1);
            expect(packets[0].data).toBe('first');
            expect(packets[1].id).toBe(2);
            expect(packets[1].data).toBe('second');
        });

        it('should buffer incomplete packets', () => {
            const packet = new Packet(1, PacketType.EXECCOMMAND, 'test');
            const buffer = packet.toBuffer();

            // Split the buffer into two parts
            const part1 = buffer.slice(0, 10);
            const part2 = buffer.slice(10);

            // First part should return no packets
            let packets = parser.appendData(part1);
            expect(packets).toHaveLength(0);

            // Second part should complete the packet
            packets = parser.appendData(part2);
            expect(packets).toHaveLength(1);
            expect(packets[0].id).toBe(1);
            expect(packets[0].data).toBe('test');
        });

        it('should handle multiple partial packets', () => {
            const packet1 = new Packet(1, PacketType.EXECCOMMAND, 'first');
            const packet2 = new Packet(2, PacketType.EXECCOMMAND, 'second');
            const buffer = Buffer.concat([
                packet1.toBuffer(),
                packet2.toBuffer(),
            ]);

            // Split across packet boundary
            const part1 = buffer.slice(0, 20);
            const part2 = buffer.slice(20);

            const packets1 = parser.appendData(part1);
            expect(packets1).toHaveLength(1);
            expect(packets1[0].id).toBe(1);

            const packets2 = parser.appendData(part2);
            expect(packets2).toHaveLength(1);
            expect(packets2[0].id).toBe(2);
        });

        it('should handle empty packets', () => {
            const packet = new Packet(1, PacketType.AUTH, null);
            const buffer = packet.toBuffer();

            const packets = parser.appendData(buffer);

            expect(packets).toHaveLength(1);
            expect(packets[0].id).toBe(1);
            expect(packets[0].type).toBe(PacketType.AUTH);
            expect(packets[0].data).toBe('');
        });

        it('should continue processing after malformed packet', () => {
            const validPacket = new Packet(1, PacketType.EXECCOMMAND, 'valid');
            const validBuffer = validPacket.toBuffer();

            // Create a malformed packet (too short)
            const malformedBuffer = Buffer.alloc(14);
            malformedBuffer.writeInt32LE(10, 0); // length
            malformedBuffer.writeInt32LE(1, 4); // id
            // Missing proper data

            const combinedBuffer = Buffer.concat([
                malformedBuffer,
                validBuffer,
            ]);

            const packets = parser.appendData(combinedBuffer);

            // Should parse at least the valid packet
            expect(packets.length).toBeGreaterThanOrEqual(1);
            const validParsed = packets.find((p) => p.data === 'valid');
            expect(validParsed).toBeDefined();
        });

        it('should handle very large data', () => {
            const largeData = 'x'.repeat(10000);
            const packet = new Packet(1, PacketType.RESPONSE_VALUE, largeData);
            const buffer = packet.toBuffer();

            const packets = parser.appendData(buffer);

            expect(packets).toHaveLength(1);
            expect(packets[0].data).toBe(largeData);
        });
    });

    describe('reset', () => {
        it('should clear buffered data', () => {
            const packet = new Packet(1, PacketType.EXECCOMMAND, 'test');
            const buffer = packet.toBuffer();
            const part1 = buffer.slice(0, 10);

            // Buffer some data
            parser.appendData(part1);
            expect(parser.hasBufferedData()).toBe(true);

            // Reset
            parser.reset();
            expect(parser.hasBufferedData()).toBe(false);
            expect(parser.getBufferSize()).toBe(0);
        });
    });

    describe('getBufferSize', () => {
        it('should return 0 for empty buffer', () => {
            expect(parser.getBufferSize()).toBe(0);
        });

        it('should return correct size for buffered data', () => {
            const packet = new Packet(1, PacketType.EXECCOMMAND, 'test');
            const buffer = packet.toBuffer();
            const part1 = buffer.slice(0, 10);

            parser.appendData(part1);
            expect(parser.getBufferSize()).toBe(10);
        });
    });

    describe('hasBufferedData', () => {
        it('should return false for empty buffer', () => {
            expect(parser.hasBufferedData()).toBe(false);
        });

        it('should return true when data is buffered', () => {
            const packet = new Packet(1, PacketType.EXECCOMMAND, 'test');
            const buffer = packet.toBuffer();
            const part1 = buffer.slice(0, 10);

            parser.appendData(part1);
            expect(parser.hasBufferedData()).toBe(true);
        });

        it('should return false after processing complete packets', () => {
            const packet = new Packet(1, PacketType.EXECCOMMAND, 'test');
            const buffer = packet.toBuffer();

            parser.appendData(buffer);
            expect(parser.hasBufferedData()).toBe(false);
        });
    });
});
