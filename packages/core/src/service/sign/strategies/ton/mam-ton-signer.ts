import { Cell } from '@ton/core';
import { sign } from '@ton/crypto';

import { mnemonicToKeypair } from '../../../mnemonicService';
import { deriveMetaKeyPair } from '../../meta-keys';
import { getMAMWalletMnemonic } from '../../secrets';
import { SignerFactory } from '../../types';
import { loadAccountOfType, pickWallet } from './_shared';

/**
 * MAM (multi-account mnemonic) strategy. The root mnemonic is shared by
 * every child wallet; each derivation reproduces its own ed25519
 * keypair.
 */
export const mamTonSigner: SignerFactory = async ({ sdk, accountId, walletId, options }) => {
    const account = await loadAccountOfType(sdk, accountId, 'mam');
    const wallet = pickWallet(account, walletId);

    const mnemonic = await getMAMWalletMnemonic(sdk, account.id, wallet.id);

    if (options?.onMetaKeyPair) {
        options.onMetaKeyPair(await deriveMetaKeyPair(mnemonic, 'ton'));
    }

    const callback = async (message: Cell) => {
        const keyPair = await mnemonicToKeypair(mnemonic, 'ton');
        return sign(message.hash(), keyPair.secretKey);
    };
    callback.type = 'cell' as const;
    return callback;
};
