import { AppKey } from '../Keys';
import { IStorage } from '../Storage';
import { DeprecatedWalletState, TonWalletStandard, WalletId } from '../entries/wallet';

import {
    Account,
    AccountId,
    AccountKeystone,
    AccountLedger,
    AccountsState,
    AccountTonMnemonic,
    AccountTonOnly,
    defaultAccountState,
    bindAccountToClass
} from '../entries/account';

import { DeprecatedAccountState } from '../entries/account';
import { AuthState, DeprecatedAuthState } from '../entries/password';
import { assertUnreachable, notNullish } from '../utils/types';
import {
    getFallbackAccountEmoji,
    getFallbackDerivationItemEmoji,
    getFallbackTonStandardWalletEmoji,
    getWalletNameAddress
} from './walletService';

export class AccountsStorage {
    constructor(private storage: IStorage) {}

    getAccounts = async () => {
        let state = await this.storage.get<AccountsState>(AppKey.ACCOUNTS);
        if (!state) {
            state = await migrateToAccountsState(this.storage);
            if (state) {
                await this.setAccounts(state);
            }
        } else {
            state.forEach(bindAccountToClass);
        }
        return state ?? defaultAccountState;
    };

    setAccounts = async (state: AccountsState) => {
        await this.storage.set(AppKey.ACCOUNTS, state);
    };

    getActiveAccountId = async () => {
        let state = await this.storage.get<string>(AppKey.ACTIVE_ACCOUNT_ID);
        if (!state) {
            state = await this.migrateToActiveAccountIdState();
            if (state !== null) {
                await this.setActiveAccountId(state);
            }
        }
        return state ?? null;
    };

    getActiveAccount = async (): Promise<Account | null> => {
        const id = await this.getActiveAccountId();
        if (id !== null) {
            const state = await this.getAccounts();
            return state.find(a => a.id === id) || null;
        }
        return null;
    };

    getAccount = async (id: AccountId): Promise<Account | null> => {
        const state = await this.getAccounts();
        return state.find(a => a.id === id) || null;
    };

    setActiveAccountId = async (activeAccountId: AccountId | null) => {
        const accounts = await this.getAccounts();
        if (accounts.every(a => a.id !== activeAccountId)) {
            throw new Error('Account not found');
        }
        await this.storage.set(AppKey.ACTIVE_ACCOUNT_ID, activeAccountId);
    };

    addAccountToState = async (account: Account) => {
        await this.addAccountsToState([account]);
    };

    addAccountsToState = async (accounts: Account[]) => {
        const state = await this.getAccounts();
        accounts.forEach(account => {
            const existingAccIndex = state.findIndex(a => a.id === account.id);
            if (existingAccIndex !== -1) {
                state[existingAccIndex] = account;
                return;
            }
            state.push(account);
        });
        await this.setAccounts(state);
    };

    /**
     * Replace found wallets with same id in state and replace them with new ones with no array order changes
     */
    updateAccountsInState = async (accounts: Account[]) => {
        const state = await this.getAccounts();

        for (let i = 0; i < state.length; i++) {
            const account = accounts.find(a => a.id === state[i].id);
            if (!account) {
                continue;
            }

            state[i] = account;
        }

        await this.setAccounts(state);
    };

    /**
     * Replace found wallet with same id in state and replace it with new one with no array order changes
     */
    updateAccountInState = async (account: Account) => {
        return this.updateAccountsInState([account]);
    };

    removeAccountFromState = async (id: AccountId) => {
        const state = await this.getAccounts();
        const activeAccountId = await this.getActiveAccountId();

        const newState = state.filter(w => w.id !== id);

        if (activeAccountId === id) {
            await this.setActiveAccountId(newState[0]?.id || null);
        }

        await this.setAccounts(state.filter(w => w.id !== id));
    };

    async getNewAccountNameAndEmoji(accountId: AccountId) {
        const existingAccounts = await this.getAccounts();
        const existingAccount = existingAccounts.find(a => a.id === accountId);
        const name = existingAccount?.name || 'Account ' + (existingAccounts.length + 1);
        const emoji = existingAccount?.emoji || getFallbackAccountEmoji(accountId);
        return { name, emoji };
    }

    private migrateToActiveAccountIdState = async (): Promise<WalletId | null> => {
        const state = await this.storage.get<DeprecatedAccountState>(AppKey.DEPRECATED_ACCOUNT);
        if (!state || !state.activePublicKey) {
            return null;
        }

        const accounts = await this.getAccounts();
        return (
            accounts.find(a => a.allTonWallets.some(w => w.publicKey === state.activePublicKey))
                ?.id || null
        );
    };
}

export const accountsStorage = (storage: IStorage): AccountsStorage => new AccountsStorage(storage);

async function migrateToAccountsState(storage: IStorage): Promise<AccountsState | null> {
    const state = await storage.get<DeprecatedAccountState>(AppKey.DEPRECATED_ACCOUNT);
    if (!state) {
        return null;
    }

    const accounts: (Account | null)[] = await Promise.all(
        state.publicKeys.map(async (pk, index) => {
            const w = await storage.get<DeprecatedWalletState>(`${AppKey.DEPRECATED_WALLET}_${pk}`);
            if (!w) {
                return null;
            }

            let auth: AuthState;
            let walletAuth = w.auth;
            if (!walletAuth) {
                walletAuth =
                    (await storage.get<DeprecatedAuthState>(AppKey.DEPRECATED_GLOBAL_AUTH_STATE)) ??
                    undefined;
            }

            if (!walletAuth) {
                console.error('Wallet without auth detected', w.active.friendlyAddress);
                return null;
            }

            if (walletAuth.kind === 'none') {
                console.error('NONE AUTH detected for wallet', w.active.friendlyAddress);
                return null;
            }

            if (walletAuth.kind === 'password') {
                const encryptedMnemonic = await storage.get<string>(
                    `${AppKey.DEPRECATED_MNEMONIC}_${pk}`
                );

                if (!encryptedMnemonic) {
                    console.error('Wallet without mnemonic detected', w.active.friendlyAddress);
                    return null;
                }

                auth = {
                    kind: walletAuth.kind,
                    encryptedMnemonic
                };
            } else if (walletAuth.kind === 'keychain') {
                auth = {
                    kind: 'keychain',
                    keychainStoreKey: w.publicKey
                };
            } else {
                auth = walletAuth;
            }

            const name = w.name || 'Account ' + (index + 1);
            const emoji = w.emoji;

            const tonWallet: TonWalletStandard = {
                id: w.active.rawAddress,
                publicKey: w.publicKey,
                version: w.active.version,
                rawAddress: w.active.rawAddress,
                name: getWalletNameAddress(w.active.rawAddress),
                emoji: getFallbackTonStandardWalletEmoji(w.publicKey, w.active.version)
            };

            const authKind = auth.kind;
            switch (authKind) {
                case 'password':
                case 'keychain':
                    return new AccountTonMnemonic(
                        w.publicKey,
                        name,
                        emoji,
                        auth,
                        w.active.rawAddress,
                        [tonWallet]
                    );
                case 'signer':
                case 'signer-deeplink':
                    return new AccountTonOnly(w.publicKey, name, emoji, auth, w.active.rawAddress, [
                        tonWallet
                    ]);

                case 'keystone':
                    return new AccountKeystone(w.publicKey, name, emoji, auth.info, tonWallet);

                case 'ledger':
                    return new AccountLedger(w.publicKey, name, emoji, auth.accountIndex, [
                        {
                            index: auth.accountIndex,
                            activeTonWalletId: tonWallet.rawAddress,
                            name,
                            emoji: getFallbackDerivationItemEmoji(w.publicKey, auth.accountIndex),
                            tonWallets: [tonWallet]
                        }
                    ]);
                default:
                    assertUnreachable(authKind);
            }
        })
    );

    return accounts.filter(notNullish);
}
