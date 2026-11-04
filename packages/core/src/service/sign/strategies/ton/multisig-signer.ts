import { SignerFactory } from '../../types';

/**
 * Multisig accounts do not sign through this dispatcher — multisig
 * transfers are co-signed via the dedicated proposal flow. The legacy
 * `getSigner()` threw synchronously; this strategy preserves that.
 */
export const multisigTonSigner: SignerFactory = async () => {
    throw new Error('Cannot get signer for multisig account');
};
