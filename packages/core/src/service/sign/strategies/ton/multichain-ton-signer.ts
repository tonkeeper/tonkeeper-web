import { Cell } from '@ton/core';
import { sign } from '@ton/crypto';

import { mnemonicToKeypair } from '../../../mnemonicService';
import { deriveMetaKeyPair } from '../../meta-keys';
import { getAccountSecret } from '../../secrets';
import { SignerFactory } from '../../types';
import { loadAccountOfType, pickWallet } from './_shared';

/**
 * TON signer for multichain accounts. Mirrors `mnemonicLikeTonSigner`
 * but always derives the keypair via BIP39 — `AccountMultichain` is
 * BIP39 by construction, so there is no `mnemonicType` field to inspect.
 *
 * The resulting BOC is byte-identical to a `mnemonic-bip39` legacy
 * account at the same wallet version × network, since both derivations
 * collapse to the same ed25519 keypair. The snapshot harness pins this
 * equivalence per (version, network) combo.
 */
export const multichainTonSigner: SignerFactory = async ({ sdk, accountId, walletId, options }) => {
    const account = await loadAccountOfType(sdk, accountId, 'multichain');
    pickWallet(account, walletId);

    const secret = await getAccountSecret(sdk, account.id);
    if (secret.type !== 'mnemonic') {
        throw new Error('Unexpected secret type');
    }

    if (options?.onMetaKeyPair) {
        options.onMetaKeyPair(await deriveMetaKeyPair(secret.mnemonic, 'bip39'));
    }

    const callback = async (message: Cell) => {
        const keyPair = await mnemonicToKeypair(secret.mnemonic, 'bip39');
        return sign(message.hash(), keyPair.secretKey);
    };
    callback.type = 'cell' as const;
    return callback;
};
