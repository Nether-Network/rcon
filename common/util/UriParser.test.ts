import { parseUri, Uri } from './UriParser';

describe('UriParser', () => {
    describe('should parse Uri', () => {
        const dataSet: { expected: Uri; input: string }[] = [
            {
                expected: {
                    host: 'localhost',
                    port: null,
                    password: null,
                    tls: false,
                },
                input: 'localhost',
            },
            {
                expected: {
                    host: 'localhost',
                    port: 25575,
                    password: null,
                    tls: false,
                },
                input: 'localhost:25575',
            },
            {
                expected: {
                    host: '127.0.0.1',
                    port: null,
                    password: 'test',
                    tls: false,
                },
                input: 'test@127.0.0.1',
            },
            {
                expected: {
                    host: '127.0.0.1',
                    port: null,
                    password: null,
                    tls: true,
                },
                input: 'tls://127.0.0.1',
            },
            {
                expected: {
                    host: 'example.com',
                    port: 1234,
                    password: 'pass',
                    tls: true,
                },
                input: 'tls://pass@example.com:1234',
            },
            {
                expected: {
                    host: '192.168.1.1',
                    port: 8080,
                    password: null,
                    tls: true,
                },
                input: 'tls://192.168.1.1:8080',
            },
            {
                expected: {
                    host: 'myhost',
                    port: null,
                    password: 'secret',
                    tls: true,
                },
                input: 'tls://secret@myhost',
            },
            {
                expected: {
                    host: 'myhost',
                    port: 65535,
                    password: null,
                    tls: false,
                },
                input: 'myhost:65535',
            },
            {
                expected: {
                    host: 'myhost',
                    port: 1,
                    password: null,
                    tls: false,
                },
                input: 'myhost:1',
            },
            {
                expected: {
                    host: 'host-name',
                    port: null,
                    password: null,
                    tls: false,
                },
                input: 'host-name',
            },
            {
                expected: {
                    host: 'sub.domain.com',
                    port: 123,
                    password: null,
                    tls: false,
                },
                input: 'sub.domain.com:123',
            },
            {
                expected: {
                    host: 'host_name123',
                    port: null,
                    password: null,
                    tls: false,
                },
                input: 'host_name123',
            },
            {
                expected: {
                    host: '001.002.003.004',
                    port: null,
                    password: null,
                    tls: false,
                },
                input: '001.002.003.004',
            },
            {
                expected: {
                    host: 'localhost',
                    port: 1,
                    password: 'abc123',
                    tls: true,
                },
                input: 'TLS://abc123@localhost:1',
            },
            {
                expected: {
                    host: 'host-name',
                    port: null,
                    password: 'pw',
                    tls: false,
                },
                input: 'pw@host-name',
            },
        ];

        it.each(dataSet)(
            'returns the uri for $input',
            ({ expected, input }) => {
                const result = parseUri(input);
                expect(result).toStrictEqual(expected);
            }
        );

        it('throws error for invalid format', () => {
            expect(() => parseUri('tls://:1234')).toThrow();
            expect(() => parseUri('user@')).toThrow();
            expect(() => parseUri('host:70000')).toThrow();
            expect(() => parseUri('')).toThrow();
            expect(() => parseUri('host:abc')).toThrow(); // non-numeric port
            expect(() => parseUri('host@@name')).toThrow(); // double @
            expect(() => parseUri('host::123')).toThrow(); // double colon
            expect(() => parseUri('host name')).toThrow(); // space in host
            expect(() => parseUri('tls://user@host:0')).toThrow(); // port 0
            expect(() => parseUri('tls://user@host:65536')).toThrow(); // port > 65535
            expect(() => parseUri('tls://user@host:-1')).toThrow(); // negative port
        });
    });
});
