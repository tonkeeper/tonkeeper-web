import { SignerFactory } from '../../types';

/**
 * Watch-only accounts have no key material — any signing request is a
 * programmer error. The legacy `getSigner()` threw synchronously; this
 * strategy preserves that behaviour at lookup time.
 */
export const watchOnlyTonSigner: SignerFactory = async () => {
    throw new Error('Cannot get signer for watch-only account');
};
