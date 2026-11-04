import { IAppSdk } from '../../AppSdk';
import { AccountId } from '../../entries/account';
import { WalletId } from '../../entries/wallet';
import { accountsStorage } from '../accountsStorage';

import { resolve } from './registry';
import { registerMultichainStubs } from './strategies/multichain-stubs';
import { registerTonStrategies } from './strategies/ton';
import { ChainSigner, Signer, SignerOptions } from './types';

registerTonStrategies();
registerMultichainStubs();

interface GetSignerOptions extends SignerOptions {
    walletId?: WalletId;
}

/**
 * Core-side signer factory. Dispatches by `(account.type, chain)` via
 * the strategy registry; today only chain `'ton'` is wired.
 */
export const getSigner = async (
    sdk: IAppSdk,
    accountId: AccountId,
    { walletId, ...options }: GetSignerOptions = {}
): Promise<Signer> => {
    try {
        const account = await accountsStorage(sdk.storage).getAccount(accountId);
        if (!account) {
            throw new Error('Wallet not found');
        }

        const signer: ChainSigner = await resolve({
            sdk,
            accountId,
            accountType: account.type,
            chain: 'ton',
            walletId,
            options
        });

        return signer;
    } catch (e) {
        console.error(e);
        throw e;
    }
};
