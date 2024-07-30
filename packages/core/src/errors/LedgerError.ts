export class LedgerError extends Error {
    cause: unknown;

    constructor(message: string, cause?: unknown) {
        super(message);
        this.name = 'LedgerError';
        this.cause = cause;
    }
}
