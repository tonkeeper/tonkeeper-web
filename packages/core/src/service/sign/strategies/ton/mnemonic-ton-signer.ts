import { Cell } from '@ton/core';
import { sign } from '@ton/crypto';

import { mnemonicToKeypair } from '../../../mnemonicService';
import { deriveMetaKeyPair } from '../../meta-keys';
import { getAccountSecret } from '../../secrets';
import { SignerFactory } from '../../types';
import { loadAccountOfType, pickWallet } from './_shared';

/**
 * Shared strategy for `mnemonic` and `testnet` account types — they
 * differ only in which network the wallet contract addresses, not in
 * how the signature is produced. `account.mnemonicType` distinguishes
 * BIP39 vs TON-native dictionaries during key derivation.
 */
const mnemonicLikeTonSigner =
    (expected: 'mnemonic' | 'testnet'): SignerFactory =>
    async ({ sdk, accountId, walletId, options }) => {
        const account = await loadAccountOfType(sdk, accountId, expected);
        pickWallet(account, walletId);

        const secret = await getAccountSecret(sdk, account.id);
        if (secret.type !== 'mnemonic') {
            throw new Error('Unexpected secret type');
        }

        if (options?.onMetaKeyPair) {
            options.onMetaKeyPair(await deriveMetaKeyPair(secret.mnemonic, account.mnemonicType));
        }

        const callback = async (message: Cell) => {
            const keyPair = await mnemonicToKeypair(secret.mnemonic, account.mnemonicType);
            return sign(message.hash(), keyPair.secretKey);
        };
        callback.type = 'cell' as const;
        return callback;
    };

export const mnemonicTonSigner: SignerFactory = mnemonicLikeTonSigner('mnemonic');
export const testnetTonSigner: SignerFactory = mnemonicLikeTonSigner('testnet');
