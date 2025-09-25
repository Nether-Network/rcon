import { NoopAuthHandler } from './NoopAuthHandler';
import { PasswordAuthHandler } from './PasswordAuthHandler';

describe('NoopAuthHandler', () => {
    let handler: NoopAuthHandler;

    beforeEach(() => {
        handler = new NoopAuthHandler();
    });

    it('should resolve with true for any password', async () => {
        expect(await handler.authenticate('any-password')).toBe(true);
    });

    it('should resolve with true for empty string', async () => {
        expect(await handler.authenticate('')).toBe(true);
    });

    it('should resolve with true for arbitrary string', async () => {
        expect(await handler.authenticate('!@#$%^&*()')).toBe(true);
    });
});

describe('PasswordAuthHandler', () => {
    it('should resolve with true when password matches exactly', async () => {
        const handler = new PasswordAuthHandler('secret');
        expect(await handler.authenticate('secret')).toBe(true);
    });

    it('should resolve with false when password does not match', async () => {
        const handler = new PasswordAuthHandler('secret');
        expect(await handler.authenticate('wrong')).toBe(false);
    });

    it('should resolve with false for empty string when password is set', async () => {
        const handler = new PasswordAuthHandler('secret');
        expect(await handler.authenticate('')).toBe(false);
    });

    it('should resolve with false for correct prefix but longer string', async () => {
        const handler = new PasswordAuthHandler('secret');
        expect(await handler.authenticate('secretextra')).toBe(false);
    });

    it('should be case-sensitive', async () => {
        const handler = new PasswordAuthHandler('Secret');
        expect(await handler.authenticate('secret')).toBe(false);
    });

    it('should resolve with true when both password and input are empty string', async () => {
        const handler = new PasswordAuthHandler('');
        expect(await handler.authenticate('')).toBe(true);
    });
});
