export class KeychainGetError extends Error {
    constructor() {
        super('Failed to read keychain data');
        this.name = 'KeychainGetError';
    }
}
