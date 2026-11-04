import { IAppSdk } from '../../../../AppSdk';
import { Account, isAccountTronCompatible } from '../../../../entries/account';
import { TronApi } from '../../../../tronApi';
import { assertUnreachable } from '../../../../utils/types';
import { tonMnemonicToTronMnemonic } from '../../../walletService';
import type { Transaction } from 'tronweb/src/types/Transaction';

import { getAccountSecret, getMAMWalletMnemonic } from '../../secrets';
import { TronSigner } from '../../types';

/**
 * Legacy TRON signer. Invoked via the original call sites (uikit
 * re-exports `getTronSigner`). Lives next to the multichain strategy
 * structure to make the eventual unified rewrite obvious, but keeps the
 * original dispatch shape for now.
 */
export const getTronSigner = (sdk: IAppSdk, tronApi: TronApi, account: Account): TronSigner => {
    try {
        if (!isAccountTronCompatible(account)) {
            throw new Error("Account doesn't support tron");
        }

        const wallet = account.activeTronWallet;

        if (!wallet) {
            throw new Error('Wallet not found');
        }

        switch (account.type) {
            case 'mam': {
                return async (tx: Transaction) => {
                    const tonMnemonic = await getMAMWalletMnemonic(
                        sdk,
                        account.id,
                        account.activeTonWallet.id
                    );
                    const tronMnemonic = await tonMnemonicToTronMnemonic(tonMnemonic, 'ton');
                    const { TronWeb } = await import('tronweb');
                    const tronWeb = new TronWeb({
                        fullHost: tronApi.tronGridBaseUrl,
                        privateKey: TronWeb.fromMnemonic(tronMnemonic.join(' ')).privateKey.slice(2)
                    });

                    return tronWeb.trx.sign(tx);
                };
            }
            case 'mnemonic': {
                return async (tx: Transaction) => {
                    const secret = await getAccountSecret(sdk, account.id);
                    if (secret.type !== 'mnemonic') {
                        throw new Error('Unexpected secret type');
                    }
                    const tonMnemonic = secret.mnemonic;
                    const tronMnemonic = await tonMnemonicToTronMnemonic(
                        tonMnemonic,
                        account.mnemonicType
                    );
                    const { TronWeb } = await import('tronweb');
                    const tronWeb = new TronWeb({
                        fullHost: tronApi.tronGridBaseUrl,
                        privateKey: TronWeb.fromMnemonic(tronMnemonic.join(' ')).privateKey.slice(2)
                    });

                    return tronWeb.trx.sign(tx);
                };
            }
            default: {
                assertUnreachable(account);
            }
        }
    } catch (e) {
        console.error(e);
        throw e;
    }
};
