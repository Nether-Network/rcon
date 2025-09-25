import { ServerConfigValidator } from './ServerConfigValidator';
import { ValidationError } from '@nether-network/rcon-common';

describe('ServerConfigValidator', () => {
    it('should validate valid server config', () => {
        expect(() =>
            ServerConfigValidator.validate({
                host: 'localhost',
                port: 25575,
            })
        ).not.toThrow();
    });

    it('should validate default server config', () => {
        expect(() => ServerConfigValidator.validate()).not.toThrow();
        expect(() => ServerConfigValidator.validate({})).not.toThrow();
    });

    it('should reject invalid host', () => {
        expect(() =>
            ServerConfigValidator.validate({
                host: 'invalid host name',
            })
        ).toThrow(ValidationError);
    });

    it('should reject invalid port', () => {
        expect(() =>
            ServerConfigValidator.validate({
                port: 0,
            })
        ).toThrow(ValidationError);
    });

    it('should warn about privileged port', () => {
        expect(() =>
            ServerConfigValidator.validate({
                port: 80,
            })
        ).toThrow(ValidationError);
    });

    it('should reject non-array authHandlers', () => {
        expect(() =>
            ServerConfigValidator.validate({
                authHandlers: 'not an array' as any,
            })
        ).toThrow(ValidationError);
    });

    it('should reject non-array commands', () => {
        expect(() =>
            ServerConfigValidator.validate({
                commands: 'not an array' as any,
            })
        ).toThrow(ValidationError);
    });

    it('should reject non-boolean addHelpCommand', () => {
        expect(() =>
            ServerConfigValidator.validate({
                addHelpCommand: 'yes' as any,
            })
        ).toThrow(ValidationError);
    });
});
