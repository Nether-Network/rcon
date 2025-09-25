import { MockClient } from './MockClient';
import { IClient } from './IClient';

describe('IClient interface', () => {
    describe('MockClient implementation', () => {
        let client: IClient;

        beforeEach(() => {
            client = new MockClient();
        });

        it('should implement IClient interface', () => {
            expect(client.connect).toBeDefined();
            expect(client.send).toBeDefined();
            expect(client.close).toBeDefined();
            expect(client.isConnected).toBeDefined();
            expect(client.isAuthenticated).toBeDefined();
        });

        it('should connect and authenticate', async () => {
            const connectedSpy = jest.fn();
            const authenticatedSpy = jest.fn();

            client.on('connected', connectedSpy);
            client.on('authenticated', authenticatedSpy);

            expect(client.isConnected()).toBe(false);
            expect(client.isAuthenticated()).toBe(false);

            await client.connect();

            expect(client.isConnected()).toBe(true);
            expect(client.isAuthenticated()).toBe(true);
            expect(connectedSpy).toHaveBeenCalled();
            expect(authenticatedSpy).toHaveBeenCalled();
        });

        it('should send commands when connected', async () => {
            await client.connect();

            const response = await client.send('test command');

            expect(response).toContain('test command');
        });

        it('should throw error when sending without connection', async () => {
            await expect(client.send('test')).rejects.toThrow('Not connected');
        });

        it('should close connection', async () => {
            const disconnectedSpy = jest.fn();
            client.on('disconnected', disconnectedSpy);

            await client.connect();
            expect(client.isConnected()).toBe(true);

            await client.close();

            expect(client.isConnected()).toBe(false);
            expect(client.isAuthenticated()).toBe(false);
            expect(disconnectedSpy).toHaveBeenCalled();
        });

        it('should use configured command responses', async () => {
            const mockClient = client as MockClient;
            mockClient.setCommandResponse('list', 'Player1, Player2');

            await client.connect();
            const response = await client.send('list');

            expect(response).toBe('Player1, Player2');
        });

        it('should emit error events', (done) => {
            const mockClient = client as MockClient;

            client.on('error', (error) => {
                expect(error.message).toBe('Test error');
                done();
            });

            mockClient.simulateError('Test error');
        });
    });

    describe('Interface benefits', () => {
        it('should allow dependency injection', () => {
            // This demonstrates how consumers can depend on IClient
            // rather than concrete implementations
            function processClient(client: IClient): boolean {
                return client.isConnected();
            }

            const mockClient = new MockClient();
            expect(processClient(mockClient)).toBe(false);
        });

        it('should support testing without network I/O', async () => {
            // This test runs instantly without real network connections
            const client: IClient = new MockClient();

            await client.connect();
            const response = await client.send('test');

            expect(response).toBeDefined();
            // No actual network traffic occurred
        });
    });
});
