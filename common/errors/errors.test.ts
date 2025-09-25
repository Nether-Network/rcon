import {
    RconError,
    ConnectionError,
    AuthenticationError,
    ProtocolError,
    TimeoutError,
    ValidationError,
} from './index';

describe('Error Types', () => {
    describe('RconError', () => {
        it('should create error with message', () => {
            const error = new RconError('Test error');

            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(RconError);
            expect(error.message).toBe('Test error');
            expect(error.name).toBe('RconError');
        });

        it('should preserve cause error', () => {
            const cause = new Error('Original error');
            const error = new RconError('Wrapped error', cause);

            expect(error.cause).toBe(cause);
            expect(error.stack).toContain('Caused by');
            expect(error.stack).toContain('Original error');
        });

        it('should have proper toString', () => {
            const error = new RconError('Test error');
            expect(error.toString()).toBe('RconError: Test error');
        });

        it('should include cause in toString', () => {
            const cause = new Error('Original error');
            const error = new RconError('Wrapped error', cause);

            expect(error.toString()).toContain('Wrapped error');
            expect(error.toString()).toContain('Original error');
        });
    });

    describe('ConnectionError', () => {
        it('should extend RconError', () => {
            const error = new ConnectionError('Connection failed');

            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(RconError);
            expect(error).toBeInstanceOf(ConnectionError);
            expect(error.name).toBe('ConnectionError');
        });

        it('should preserve cause', () => {
            const cause = new Error('Network unreachable');
            const error = new ConnectionError('Cannot connect', cause);

            expect(error.cause).toBe(cause);
            expect(error.message).toBe('Cannot connect');
        });

        it('should be catchable as specific type', () => {
            try {
                throw new ConnectionError('Test');
            } catch (err) {
                expect(err instanceof ConnectionError).toBe(true);
                expect(err instanceof RconError).toBe(true);
            }
        });
    });

    describe('AuthenticationError', () => {
        it('should extend RconError', () => {
            const error = new AuthenticationError('Invalid password');

            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(RconError);
            expect(error).toBeInstanceOf(AuthenticationError);
            expect(error.name).toBe('AuthenticationError');
        });

        it('should allow specific error handling', () => {
            const handleError = (err: Error) => {
                if (err instanceof AuthenticationError) {
                    return 'auth-failed';
                } else if (err instanceof ConnectionError) {
                    return 'connection-failed';
                }
                return 'unknown';
            };

            expect(handleError(new AuthenticationError('Bad password'))).toBe(
                'auth-failed'
            );
            expect(handleError(new ConnectionError('No network'))).toBe(
                'connection-failed'
            );
        });
    });

    describe('ProtocolError', () => {
        it('should extend RconError', () => {
            const error = new ProtocolError('Malformed packet');

            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(RconError);
            expect(error).toBeInstanceOf(ProtocolError);
            expect(error.name).toBe('ProtocolError');
        });

        it('should handle parsing errors', () => {
            const parseError = new Error('Invalid packet format');
            const error = new ProtocolError('Failed to parse', parseError);

            expect(error.cause).toBe(parseError);
            expect(error.toString()).toContain('Failed to parse');
            expect(error.toString()).toContain('Invalid packet format');
        });
    });

    describe('TimeoutError', () => {
        it('should extend RconError', () => {
            const error = new TimeoutError('Request timed out');

            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(RconError);
            expect(error).toBeInstanceOf(TimeoutError);
            expect(error.name).toBe('TimeoutError');
        });

        it('should store timeout duration', () => {
            const error = new TimeoutError('Timed out', 5000);

            expect(error.timeoutMs).toBe(5000);
            expect(error.message).toBe('Timed out');
        });

        it('should include timeout in toString', () => {
            const error = new TimeoutError('Request timeout', 3000);

            expect(error.toString()).toContain('Request timeout');
            expect(error.toString()).toContain('3000ms');
        });

        it('should work without timeout value', () => {
            const error = new TimeoutError('Timeout occurred');

            expect(error.timeoutMs).toBeUndefined();
            expect(error.toString()).not.toContain('timeout:');
        });

        it('should preserve cause with timeout', () => {
            const cause = new Error('Socket timeout');
            const error = new TimeoutError('Operation timed out', 10000, cause);

            expect(error.cause).toBe(cause);
            expect(error.timeoutMs).toBe(10000);
            expect(error.toString()).toContain('10000ms');
            expect(error.toString()).toContain('Socket timeout');
        });
    });

    describe('ValidationError', () => {
        it('should extend RconError', () => {
            const error = new ValidationError('Invalid input');

            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(RconError);
            expect(error).toBeInstanceOf(ValidationError);
            expect(error.name).toBe('ValidationError');
        });

        it('should store field name', () => {
            const error = new ValidationError('Invalid port', 'port');

            expect(error.fieldName).toBe('port');
            expect(error.message).toBe('Invalid port');
        });

        it('should store field value', () => {
            const error = new ValidationError(
                'Port out of range',
                'port',
                70000
            );

            expect(error.fieldName).toBe('port');
            expect(error.value).toBe(70000);
        });

        it('should include field and value in toString', () => {
            const error = new ValidationError('Invalid port', 'port', 99999);

            const str = error.toString();
            expect(str).toContain('Invalid port');
            expect(str).toContain('field: port');
            expect(str).toContain('99999');
        });

        it('should work with only message', () => {
            const error = new ValidationError('Validation failed');

            expect(error.fieldName).toBeUndefined();
            expect(error.value).toBeUndefined();
            expect(error.toString()).toBe('ValidationError: Validation failed');
        });

        it('should handle complex values', () => {
            const complexValue = { host: 'localhost', port: -1 };
            const error = new ValidationError(
                'Invalid config',
                'config',
                complexValue
            );

            expect(error.value).toBe(complexValue);
            const str = error.toString();
            expect(str).toContain('Invalid config');
            expect(str).toContain(JSON.stringify(complexValue));
        });
    });

    describe('Error hierarchy', () => {
        it('should allow catching all RCON errors', () => {
            const errors = [
                new RconError('Base error'),
                new ConnectionError('Connection error'),
                new AuthenticationError('Auth error'),
                new ProtocolError('Protocol error'),
                new TimeoutError('Timeout error'),
                new ValidationError('Validation error'),
            ];

            errors.forEach((error) => {
                expect(error instanceof RconError).toBe(true);
                expect(error instanceof Error).toBe(true);
            });
        });

        it('should distinguish between error types', () => {
            const connectionErr = new ConnectionError('Connection failed');
            const authErr = new AuthenticationError('Auth failed');

            expect(connectionErr instanceof ConnectionError).toBe(true);
            expect(connectionErr instanceof AuthenticationError).toBe(false);

            expect(authErr instanceof AuthenticationError).toBe(true);
            expect(authErr instanceof ConnectionError).toBe(false);
        });

        it('should enable type-specific error handling', () => {
            const handleRconError = (err: RconError): string => {
                if (err instanceof ValidationError) {
                    return `Invalid ${err.fieldName}: ${err.value}`;
                } else if (err instanceof TimeoutError) {
                    return `Timeout after ${err.timeoutMs}ms`;
                } else if (err instanceof AuthenticationError) {
                    return 'Authentication failed';
                } else if (err instanceof ConnectionError) {
                    return 'Connection failed';
                } else if (err instanceof ProtocolError) {
                    return 'Protocol error';
                } else {
                    return 'Unknown error';
                }
            };

            expect(
                handleRconError(new ValidationError('Bad port', 'port', -1))
            ).toBe('Invalid port: -1');

            expect(handleRconError(new TimeoutError('Timeout', 5000))).toBe(
                'Timeout after 5000ms'
            );

            expect(
                handleRconError(new AuthenticationError('Bad password'))
            ).toBe('Authentication failed');

            expect(handleRconError(new ConnectionError('No network'))).toBe(
                'Connection failed'
            );

            expect(handleRconError(new ProtocolError('Bad packet'))).toBe(
                'Protocol error'
            );
        });
    });
});
