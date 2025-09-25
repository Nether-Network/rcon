import {
    validateHost,
    validatePort,
    validateTimeout,
    validateUri,
    validateServerName,
    validateReconnectInterval,
    validateNotEmpty,
} from './validators';
import { ValidationError } from '../errors';

describe('Configuration Validators', () => {
    describe('validateHost', () => {
        it('should accept valid hostnames', () => {
            expect(() => validateHost('localhost')).not.toThrow();
            expect(() => validateHost('example.com')).not.toThrow();
            expect(() => validateHost('sub.domain.com')).not.toThrow();
            expect(() => validateHost('192.168.1.1')).not.toThrow();
            expect(() => validateHost('host-name')).not.toThrow();
            expect(() => validateHost('host_name')).not.toThrow();
        });

        it('should reject empty host', () => {
            expect(() => validateHost('')).toThrow(ValidationError);
            expect(() => validateHost(null)).toThrow(ValidationError);
            expect(() => validateHost(undefined)).toThrow(ValidationError);
        });

        it('should reject whitespace-only host', () => {
            expect(() => validateHost('   ')).toThrow(ValidationError);
        });

        it('should reject invalid characters', () => {
            expect(() => validateHost('host@name')).toThrow(ValidationError);
            expect(() => validateHost('host name')).toThrow(ValidationError);
            expect(() => validateHost('host/name')).toThrow(ValidationError);
        });

        it('should reject too long hostname', () => {
            const longHost = 'a'.repeat(254);
            expect(() => validateHost(longHost)).toThrow(ValidationError);
        });

        it('should reject non-string values', () => {
            expect(() => validateHost(123 as any)).toThrow(ValidationError);
        });
    });

    describe('validatePort', () => {
        it('should accept valid ports', () => {
            expect(() => validatePort(1)).not.toThrow();
            expect(() => validatePort(8080)).not.toThrow();
            expect(() => validatePort(25575)).not.toThrow();
            expect(() => validatePort(65535)).not.toThrow();
        });

        it('should allow null/undefined (optional port)', () => {
            expect(() => validatePort(null)).not.toThrow();
            expect(() => validatePort(undefined)).not.toThrow();
        });

        it('should reject port out of range', () => {
            expect(() => validatePort(0)).toThrow(ValidationError);
            expect(() => validatePort(-1)).toThrow(ValidationError);
            expect(() => validatePort(65536)).toThrow(ValidationError);
            expect(() => validatePort(100000)).toThrow(ValidationError);
        });

        it('should reject non-integer ports', () => {
            expect(() => validatePort(80.5)).toThrow(ValidationError);
            expect(() => validatePort(NaN)).toThrow(ValidationError);
        });

        it('should reject non-number values', () => {
            expect(() => validatePort('8080' as any)).toThrow(ValidationError);
        });

        it('should use custom field name in error', () => {
            try {
                validatePort(99999, 'customPort');
                fail('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationError);
                expect((error as ValidationError).fieldName).toBe('customPort');
            }
        });
    });

    describe('validateTimeout', () => {
        it('should accept valid timeouts', () => {
            expect(() => validateTimeout(100)).not.toThrow();
            expect(() => validateTimeout(5000)).not.toThrow();
            expect(() => validateTimeout(60000)).not.toThrow();
        });

        it('should allow null/undefined (optional timeout)', () => {
            expect(() => validateTimeout(null)).not.toThrow();
            expect(() => validateTimeout(undefined)).not.toThrow();
        });

        it('should reject negative timeout', () => {
            expect(() => validateTimeout(-1)).toThrow(ValidationError);
        });

        it('should reject zero timeout', () => {
            expect(() => validateTimeout(0)).toThrow(ValidationError);
        });

        it('should reject too large timeout', () => {
            expect(() => validateTimeout(700000)).toThrow(ValidationError);
        });

        it('should reject non-integer timeouts', () => {
            expect(() => validateTimeout(100.5)).toThrow(ValidationError);
        });

        it('should reject non-number values', () => {
            expect(() => validateTimeout('5000' as any)).toThrow(
                ValidationError
            );
        });
    });

    describe('validateUri', () => {
        it('should accept valid URI', () => {
            expect(() =>
                validateUri({
                    host: 'localhost',
                    port: 25575,
                    password: 'pass',
                    tls: false,
                })
            ).not.toThrow();
        });

        it('should accept URI with null port and password', () => {
            expect(() =>
                validateUri({
                    host: 'localhost',
                    port: null,
                    password: null,
                    tls: false,
                })
            ).not.toThrow();
        });

        it('should reject null/undefined URI', () => {
            expect(() => validateUri(null)).toThrow(ValidationError);
            expect(() => validateUri(undefined)).toThrow(ValidationError);
        });

        it('should reject non-object URI', () => {
            expect(() => validateUri('localhost' as any)).toThrow(
                ValidationError
            );
        });

        it('should reject invalid host in URI', () => {
            expect(() =>
                validateUri({
                    host: '',
                    port: 25575,
                    password: null,
                    tls: false,
                })
            ).toThrow(ValidationError);
        });

        it('should reject invalid port in URI', () => {
            expect(() =>
                validateUri({
                    host: 'localhost',
                    port: 99999,
                    password: null,
                    tls: false,
                })
            ).toThrow(ValidationError);
        });

        it('should reject non-boolean TLS flag', () => {
            expect(() =>
                validateUri({
                    host: 'localhost',
                    port: 25575,
                    password: null,
                    tls: 'yes' as any,
                })
            ).toThrow(ValidationError);
        });

        it('should reject non-string password', () => {
            expect(() =>
                validateUri({
                    host: 'localhost',
                    port: 25575,
                    password: 123 as any,
                    tls: false,
                })
            ).toThrow(ValidationError);
        });
    });

    describe('validateServerName', () => {
        it('should accept valid server names', () => {
            expect(() => validateServerName('survival')).not.toThrow();
            expect(() => validateServerName('creative-server')).not.toThrow();
            expect(() => validateServerName('server_1')).not.toThrow();
            expect(() => validateServerName('My Server')).not.toThrow();
        });

        it('should reject empty name', () => {
            expect(() => validateServerName('')).toThrow(ValidationError);
            expect(() => validateServerName(null)).toThrow(ValidationError);
            expect(() => validateServerName(undefined)).toThrow(
                ValidationError
            );
        });

        it('should reject whitespace-only name', () => {
            expect(() => validateServerName('   ')).toThrow(ValidationError);
        });

        it('should reject too long name', () => {
            const longName = 'a'.repeat(101);
            expect(() => validateServerName(longName)).toThrow(ValidationError);
        });

        it('should reject invalid characters', () => {
            expect(() => validateServerName('server@name')).toThrow(
                ValidationError
            );
            expect(() => validateServerName('server/name')).toThrow(
                ValidationError
            );
        });

        it('should reject non-string values', () => {
            expect(() => validateServerName(123 as any)).toThrow(
                ValidationError
            );
        });
    });

    describe('validateReconnectInterval', () => {
        it('should accept valid intervals', () => {
            expect(() => validateReconnectInterval(100)).not.toThrow();
            expect(() => validateReconnectInterval(5000)).not.toThrow();
            expect(() => validateReconnectInterval(60000)).not.toThrow();
        });

        it('should allow null/undefined (optional)', () => {
            expect(() => validateReconnectInterval(null)).not.toThrow();
            expect(() => validateReconnectInterval(undefined)).not.toThrow();
        });

        it('should reject negative interval', () => {
            expect(() => validateReconnectInterval(-1)).toThrow(
                ValidationError
            );
        });

        it('should reject too short interval', () => {
            expect(() => validateReconnectInterval(50)).toThrow(
                ValidationError
            );
        });

        it('should reject too large interval', () => {
            expect(() => validateReconnectInterval(400000)).toThrow(
                ValidationError
            );
        });

        it('should reject non-integer intervals', () => {
            expect(() => validateReconnectInterval(100.5)).toThrow(
                ValidationError
            );
        });

        it('should reject non-number values', () => {
            expect(() => validateReconnectInterval('5000' as any)).toThrow(
                ValidationError
            );
        });
    });

    describe('validateNotEmpty', () => {
        it('should accept non-empty array', () => {
            expect(() => validateNotEmpty([1, 2, 3], 'items')).not.toThrow();
            expect(() => validateNotEmpty(['a'], 'items')).not.toThrow();
        });

        it('should reject empty array', () => {
            expect(() => validateNotEmpty([], 'items')).toThrow(
                ValidationError
            );
        });

        it('should reject null/undefined', () => {
            expect(() => validateNotEmpty(null, 'items')).toThrow(
                ValidationError
            );
            expect(() => validateNotEmpty(undefined, 'items')).toThrow(
                ValidationError
            );
        });

        it('should include field name in error', () => {
            try {
                validateNotEmpty([], 'servers');
                fail('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationError);
                expect((error as ValidationError).message).toContain('servers');
            }
        });
    });
});
