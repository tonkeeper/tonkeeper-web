import { TranslatableError } from './TranslatableError';

export class TxConfirmationCustomError extends Error {
    constructor(message: string, public translate?: TranslatableError['translate']) {
        super(message);
        this.name = 'TxConfirmationCustomError';
    }
}
