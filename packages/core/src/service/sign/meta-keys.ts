import { KeyPair, keyPairFromSeed, sha512 } from '@ton/crypto';

import { MnemonicType } from '../../entries/password';
import { mnemonicToEd25519Seed } from '../mnemonicService';

/**
 * Key that encrypts Pro subscription metadata, derived as in tonkeeper/metadata-cypher:
 * SHA-512("meta" || wallet ed25519 seed), first 32 bytes. Callers derive it while the account is
 * unlocked for signing.
 */
export const deriveMetaKeyPair = async (
    mnemonic: string[],
    mnemonicType?: MnemonicType
): Promise<KeyPair> => {
    const walletSeed = await mnemonicToEd25519Seed(mnemonic, mnemonicType);
    const metaSeed = await sha512(Buffer.concat([Buffer.from('meta'), walletSeed]));
    return keyPairFromSeed(metaSeed.subarray(0, 32));
};
