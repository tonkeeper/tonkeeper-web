export class UserCancelledError extends Error {
    cause: unknown;

    constructor(message: string, cause?: unknown) {
        super(message);
        this.name = 'UserCancelledError';
        this.cause = cause;
    }
}
