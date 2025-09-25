import { ProxyConfigValidator } from './ProxyConfigValidator';
import { ValidationError } from '@nether-network/rcon-common';

describe('ProxyConfigValidator', () => {
    const validServerConfig = [
        {
            name: 'server1',
            host: 'localhost',
            port: 25576,
            password: 'pass1',
        },
    ];

    it('should validate valid proxy config', () => {
        expect(() =>
            ProxyConfigValidator.validate({
                host: 'localhost',
                port: 25575,
                servers: validServerConfig,
            })
        ).not.toThrow();
    });

    it('should reject null options', () => {
        expect(() => ProxyConfigValidator.validate(null as any)).toThrow(
            ValidationError
        );
    });

    it('should reject invalid host', () => {
        expect(() =>
            ProxyConfigValidator.validate({
                host: '',
                servers: validServerConfig,
            })
        ).toThrow(ValidationError);
    });

    it('should reject invalid port', () => {
        expect(() =>
            ProxyConfigValidator.validate({
                port: -1,
                servers: validServerConfig,
            })
        ).toThrow(ValidationError);
    });

    it('should reject invalid reconnect interval', () => {
        expect(() =>
            ProxyConfigValidator.validate({
                reconnectInterval: 50,
                servers: validServerConfig,
            })
        ).toThrow(ValidationError);
    });

    it('should reject missing servers array', () => {
        expect(() =>
            ProxyConfigValidator.validate({
                servers: undefined as any,
            })
        ).toThrow(ValidationError);
    });

    it('should reject empty servers array', () => {
        expect(() =>
            ProxyConfigValidator.validate({
                servers: [],
            })
        ).toThrow(ValidationError);
    });

    it('should reject non-array servers', () => {
        expect(() =>
            ProxyConfigValidator.validate({
                servers: 'not an array' as any,
            })
        ).toThrow(ValidationError);
    });

    it('should reject server with invalid name', () => {
        expect(() =>
            ProxyConfigValidator.validate({
                servers: [
                    {
                        name: '',
                        host: 'localhost',
                        port: 25576,
                    },
                ],
            })
        ).toThrow(ValidationError);
    });

    it('should reject server with invalid host', () => {
        expect(() =>
            ProxyConfigValidator.validate({
                servers: [
                    {
                        name: 'server1',
                        host: 'invalid host name',
                        port: 25576,
                    },
                ],
            })
        ).toThrow(ValidationError);
    });

    it('should reject server with invalid port', () => {
        expect(() =>
            ProxyConfigValidator.validate({
                servers: [
                    {
                        name: 'server1',
                        host: 'localhost',
                        port: 99999,
                    },
                ],
            })
        ).toThrow(ValidationError);
    });

    it('should reject duplicate server names', () => {
        expect(() =>
            ProxyConfigValidator.validate({
                servers: [
                    {
                        name: 'server1',
                        host: 'localhost',
                        port: 25576,
                    },
                    {
                        name: 'server1',
                        host: 'localhost',
                        port: 25577,
                    },
                ],
            })
        ).toThrow(ValidationError);
    });

    it('should reject duplicate server names (case insensitive)', () => {
        expect(() =>
            ProxyConfigValidator.validate({
                servers: [
                    {
                        name: 'Server1',
                        host: 'localhost',
                        port: 25576,
                    },
                    {
                        name: 'server1',
                        host: 'localhost',
                        port: 25577,
                    },
                ],
            })
        ).toThrow(ValidationError);
    });

    it('should accept multiple servers with unique names', () => {
        expect(() =>
            ProxyConfigValidator.validate({
                servers: [
                    {
                        name: 'server1',
                        host: 'localhost',
                        port: 25576,
                    },
                    {
                        name: 'server2',
                        host: 'localhost',
                        port: 25577,
                    },
                ],
            })
        ).not.toThrow();
    });
});
