export class UserCancelledError extends Error {
    cause: unknown;

    constructor(message: string, cause?: unknown) {
        super(message);
        this.name = 'UserCancelledError';
        this.cause = cause;
    }
}

/**
 * Whether a rejection is the user backing out of a security prompt rather
 * than an operational failure. The prompts reject in three shapes: this
 * class from the unlock sheet, a plain `Error` from the hardware-signer
 * pairing sheets, and a bare string from the keychain PIN dialog.
 */
export const isUserCancellation = (error: unknown): boolean => {
    if (error instanceof UserCancelledError || error === 'Pin Cancelled') {
        return true;
    }
    return (
        error instanceof Error &&
        (error.name === 'UserCancelledError' || error.message === 'Cancel auth request')
    );
};
