import { TranslatableError } from './TranslatableError';

export class KeychainGetError extends Error implements TranslatableError {
    public translate = 'keychain_read_error';

    constructor() {
        super('Failed to read keychain data');
        this.name = 'KeychainGetError';
    }
}
