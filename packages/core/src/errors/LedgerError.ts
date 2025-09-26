import { TranslatableError } from './TranslatableError';

enum LEDGER_ERRORS {
    BLIND_SIGN_ERROR = '0xbd00'
}

export class LedgerError extends Error implements TranslatableError {
    public translate?: string;

    constructor(e: unknown) {
        const message =
            typeof e === 'string'
                ? e
                : typeof e === 'object' && e && 'message' in e
                ? (e.message as string)
                : 'Unknown error';
        super(message);
        this.name = 'LedgerError';

        if (message.includes(LEDGER_ERRORS.BLIND_SIGN_ERROR)) {
            this.translate = 'ledger_blind_sign_error';
        }
    }
}
