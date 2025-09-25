import { IAuthHandler } from './IAuthHandler';

export class PasswordAuthHandler implements IAuthHandler {
    constructor(private password: string) {}

    authenticate(password: string): Promise<boolean> {
        return Promise.resolve(this.password === password);
    }
}
