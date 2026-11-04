import { IAppSdk } from '../../../../AppSdk';
import {
    Account,
    AccountId,
    AccountKeystone,
    AccountLedger,
    AccountMAM,
    AccountMultichain,
    AccountTonMnemonic,
    AccountTonMultisig,
    AccountTonOnly,
    AccountTonSK,
    AccountTonTestnet,
    AccountTonWatchOnly
} from '../../../../entries/account';
import { TonContract, WalletId } from '../../../../entries/wallet';
import { accountsStorage } from '../../../accountsStorage';

/**
 * Maps `account.type` discriminator strings to the concrete account
 * class. Strategy modules use this to narrow `Account` to the type
 * they're registered against.
 */
type AccountByType = {
    mnemonic: AccountTonMnemonic;
    testnet: AccountTonTestnet;
    sk: AccountTonSK;
    'watch-only': AccountTonWatchOnly;
    ledger: AccountLedger;
    keystone: AccountKeystone;
    'ton-only': AccountTonOnly;
    mam: AccountMAM;
    'ton-multisig': AccountTonMultisig;
    multichain: AccountMultichain;
};

export const loadAccountOfType = async <T extends Account['type']>(
    sdk: IAppSdk,
    accountId: AccountId,
    expected: T
): Promise<AccountByType[T]> => {
    const account = await accountsStorage(sdk.storage).getAccount(accountId);
    if (!account) {
        throw new Error('Wallet not found');
    }
    if (account.type !== expected) {
        throw new Error(
            `Signer strategy mismatch: expected account.type "${expected}", got "${account.type}"`
        );
    }
    return account as AccountByType[T];
};

export const pickWallet = (account: Account, walletId: WalletId | undefined): TonContract => {
    const wallet =
        walletId !== undefined ? account.getTonWallet(walletId) : account.activeTonWallet;
    if (!wallet) {
        throw new Error('Wallet not found');
    }
    return wallet;
};
