import { IAuthHandler } from './IAuthHandler';

export class NoopAuthHandler implements IAuthHandler {
    authenticate(_password: string): Promise<boolean> {
        return Promise.resolve(true);
    }
}
