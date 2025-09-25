import { MockSocket, MockSocketFactory, TcpSocketFactory } from './index';
import { Packet } from '../protocol/Packet';
import { PacketType } from '../protocol/PacketType';

describe('Socket Abstractions', () => {
    describe('MockSocket', () => {
        it('should connect successfully by default', (done) => {
            const socket = new MockSocket();

            socket.on('connect', () => {
                expect(socket.isConnected()).toBe(true);
                expect(socket.remoteAddress).toBe('localhost');
                expect(socket.remotePort).toBe(25575);
                done();
            });

            socket.connect({ host: 'localhost', port: 25575 });
        });

        it('should fail connection when configured', (done) => {
            const socket = new MockSocket({
                connectionError: new Error('Connection refused'),
            });

            socket.on('error', (error) => {
                expect(error.message).toBe('Connection refused');
                expect(socket.isConnected()).toBe(false);
                done();
            });

            socket.connect({ host: 'localhost', port: 25575 });
        });

        it('should write data successfully', (done) => {
            const socket = new MockSocket();

            socket.on('connect', () => {
                const data = Buffer.from('test data');
                const result = socket.write(data);

                expect(result).toBe(true);
                expect(socket.getWrittenData()).toHaveLength(1);
                expect(socket.getWrittenData()[0]).toEqual(data);
                done();
            });

            socket.connect({ host: 'localhost', port: 25575 });
        });

        it('should auto-receive configured data', (done) => {
            const testData = Buffer.from('test response');
            const socket = new MockSocket({
                autoReceiveData: [testData],
                autoReceiveDelay: 10,
            });

            socket.on('data', (data) => {
                expect(data).toEqual(testData);
                done();
            });

            socket.on('connect', () => {
                // Data will be auto-received after delay
            });

            socket.connect({ host: 'localhost', port: 25575 });
        });

        it('should close gracefully', (done) => {
            const socket = new MockSocket();

            socket.on('connect', () => {
                socket.end();
            });

            socket.on('close', () => {
                expect(socket.isConnected()).toBe(false);
                expect(socket.destroyed).toBe(false);
                done();
            });

            socket.connect({ host: 'localhost', port: 25575 });
        });

        it('should destroy immediately', (done) => {
            const socket = new MockSocket();

            socket.on('connect', () => {
                socket.destroy();
            });

            socket.on('close', () => {
                expect(socket.isConnected()).toBe(false);
                expect(socket.destroyed).toBe(true);
                done();
            });

            socket.connect({ host: 'localhost', port: 25575 });
        });

        it('should simulate receiving data', (done) => {
            const socket = new MockSocket();
            const testData = Buffer.from('simulated data');

            socket.on('connect', () => {
                socket.simulateReceive(testData);
            });

            socket.on('data', (data) => {
                expect(data).toEqual(testData);
                done();
            });

            socket.connect({ host: 'localhost', port: 25575 });
        });

        it('should simulate errors', (done) => {
            const socket = new MockSocket();
            const testError = new Error('simulated error');

            socket.on('connect', () => {
                socket.simulateError(testError);
            });

            socket.on('error', (error) => {
                expect(error).toEqual(testError);
                done();
            });

            socket.connect({ host: 'localhost', port: 25575 });
        });

        it('should handle RCON packet writing', (done) => {
            const socket = new MockSocket();

            socket.on('connect', () => {
                const packet = new Packet(
                    1,
                    PacketType.EXECCOMMAND,
                    'test command'
                );
                const buffer = packet.toBuffer();

                const result = socket.write(buffer);

                expect(result).toBe(true);
                expect(socket.getWrittenData()).toHaveLength(1);

                const writtenBuffer = socket.getWrittenData()[0];
                expect(writtenBuffer).toEqual(buffer);
                done();
            });

            socket.connect({ host: 'localhost', port: 25575 });
        });

        it('should clear written data', (done) => {
            const socket = new MockSocket();

            socket.on('connect', () => {
                socket.write(Buffer.from('data1'));
                socket.write(Buffer.from('data2'));

                expect(socket.getWrittenData()).toHaveLength(2);

                socket.clearWrittenData();

                expect(socket.getWrittenData()).toHaveLength(0);
                done();
            });

            socket.connect({ host: 'localhost', port: 25575 });
        });
    });

    describe('MockSocketFactory', () => {
        it('should create mock sockets with configured options', () => {
            const factory = new MockSocketFactory({
                shouldConnect: false,
                connectDelay: 100,
            });

            const socket = factory.createSocket();
            expect(socket).toBeInstanceOf(MockSocket);
        });

        it('should allow updating options', () => {
            const factory = new MockSocketFactory({ shouldConnect: true });

            factory.setOptions({ shouldConnect: false });

            const socket = factory.createSocket();
            expect(socket).toBeInstanceOf(MockSocket);
        });
    });

    describe('TcpSocketFactory', () => {
        it('should create TCP socket instances', () => {
            const factory = new TcpSocketFactory();
            const socket = factory.createSocket();

            expect(socket).toBeDefined();
            expect(typeof socket.connect).toBe('function');
            expect(typeof socket.write).toBe('function');
            expect(typeof socket.end).toBe('function');
            expect(typeof socket.destroy).toBe('function');
        });
    });
});
