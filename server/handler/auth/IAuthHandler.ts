/**
 * Strategy interface for RCON authentication.
 *
 * Implementations decide whether a given password grants access.
 * Multiple handlers can be registered; the first to return true wins.
 */
export interface IAuthHandler {
    /**
     * Evaluates whether the supplied password should be accepted.
     *
     * @param password - The password string sent by the connecting client
     * @returns Promise that resolves to true if authentication should succeed
     */
    authenticate(password: string): Promise<boolean>;
}
