import { ClientConfigValidator } from './ClientConfigValidator';
import { ValidationError } from '@nether-network/rcon-common';
const validUri = { host: 'localhost', port: 25575, password: 'secret', tls: false };
const minimalUri = { host: 'localhost', port: null, password: null, tls: false };

describe('ClientConfigValidator', () => {
    describe('validate', () => {
        it('should pass for a minimal valid config', () => {
            expect(() =>
                ClientConfigValidator.validate({ uri: minimalUri })
            ).not.toThrow();
        });

        it('should pass for a fully-specified valid config', () => {
            expect(() =>
                ClientConfigValidator.validate({
                    uri: validUri,
                    timeout: 3000,
                    logger: null,
                    socketFactory: null,
                })
            ).not.toThrow();
        });

        it('should throw ValidationError when options is null', () => {
            expect(() => ClientConfigValidator.validate(null)).toThrow(
                ValidationError
            );
        });

        it('should throw ValidationError when options is undefined', () => {
            expect(() => ClientConfigValidator.validate(undefined)).toThrow(
                ValidationError
            );
        });

        it('should throw ValidationError for invalid uri (missing host)', () => {
            expect(() =>
                ClientConfigValidator.validate({
                    uri: { host: '', port: null, password: null, tls: false },
                })
            ).toThrow(ValidationError);
        });

        it('should throw ValidationError for uri with out-of-range port', () => {
            expect(() =>
                ClientConfigValidator.validate({
                    uri: { host: 'localhost', port: 99999, password: null, tls: false },
                })
            ).toThrow(ValidationError);
        });

        it('should throw ValidationError for invalid timeout value', () => {
            expect(() =>
                ClientConfigValidator.validate({
                    uri: validUri,
                    timeout: -1,
                })
            ).toThrow(ValidationError);
        });

        it('should accept null timeout', () => {
            expect(() =>
                ClientConfigValidator.validate({ uri: validUri, timeout: null })
            ).not.toThrow();
        });

        it('should accept null logger', () => {
            expect(() =>
                ClientConfigValidator.validate({ uri: validUri, logger: null })
            ).not.toThrow();
        });
    });

    describe('validateAndApplyDefaults', () => {
        it('should apply default port 25575 when port is null', () => {
            const result = ClientConfigValidator.validateAndApplyDefaults({
                uri: minimalUri,
            });
            expect(result.uri.port).toBe(25575);
        });

        it('should apply default timeout 5000 when timeout is omitted', () => {
            const result = ClientConfigValidator.validateAndApplyDefaults({
                uri: minimalUri,
            });
            expect(result.timeout).toBe(5000);
        });

        it('should preserve explicit port when provided', () => {
            const result = ClientConfigValidator.validateAndApplyDefaults({
                uri: { ...minimalUri, port: 27015 },
            });
            expect(result.uri.port).toBe(27015);
        });

        it('should preserve explicit timeout when provided', () => {
            const result = ClientConfigValidator.validateAndApplyDefaults({
                uri: validUri,
                timeout: 2000,
            });
            expect(result.timeout).toBe(2000);
        });

        it('should set logger to null when omitted', () => {
            const result = ClientConfigValidator.validateAndApplyDefaults({
                uri: validUri,
            });
            expect(result.logger).toBeNull();
        });

        it('should set socketFactory to null when omitted', () => {
            const result = ClientConfigValidator.validateAndApplyDefaults({
                uri: validUri,
            });
            expect(result.socketFactory).toBeNull();
        });

        it('should apply empty string as default password when password is null', () => {
            const result = ClientConfigValidator.validateAndApplyDefaults({
                uri: minimalUri,
            });
            expect(result.uri.password).toBe('');
        });

        it('should throw ValidationError for invalid input (delegates to validate)', () => {
            expect(() =>
                ClientConfigValidator.validateAndApplyDefaults(null as any)
            ).toThrow(ValidationError);
        });
    });
});
