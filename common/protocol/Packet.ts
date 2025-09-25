import { PacketType } from './PacketType';

export class Packet {
    id: number;
    type: PacketType;
    data: string | null;

    constructor(id: number, type: PacketType, data: string | null = null) {
        this.id = id;
        this.type = type;
        this.data = data;
    }

    toString(): string {
        return `Packet{${this.id},${this.type},[${this.data?.length}]}`;
    }

    toBuffer(): Buffer {
        const bodyBuffer =
            this.data !== null ? Buffer.from(this.data, 'ascii') : null;
        const bodyLength = bodyBuffer?.length ?? 0;
        // RCON packet: Length (4) + RequestID (4) + Type (4) + Body + Null (1) + Null (1)
        const data = Buffer.alloc(14 + bodyLength);

        data.writeInt32LE(10 + bodyLength, 0); // Length (RequestID + Type + Body + 2 null bytes)
        data.writeInt32LE(this.id, 4); // Request ID
        data.writeInt32LE(this.type as number, 8); // Type
        bodyBuffer?.copy(data, 12); // Body
        data.writeUInt8(0, 12 + bodyLength); // First null terminator
        data.writeUInt8(0, 13 + bodyLength); // Second null terminator

        return data;
    }

    static fromBuffer(data: Buffer): Packet {
        if (data.length < 10) {
            throw new Error('invalid data for rcon packet');
        }

        const id = data.readInt32LE(0);
        const type = data.readInt32LE(4) as PacketType;
        const body = data.slice(8, data.length - 2).toString('ascii');

        return new Packet(id, type, body);
    }
}
