export class TxConfirmationCustomError extends Error {
    cause: unknown;

    constructor(message: string, cause?: unknown) {
        super(message);
        this.name = 'TxConfirmationCustomError';
        this.cause = cause;
    }
}
