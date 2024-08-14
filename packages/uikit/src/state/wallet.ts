import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mnemonicValidate } from '@ton/crypto';
import {
    Account,
    AccountId,
    AccountTonMnemonic,
    AccountTonWatchOnly,
    AccountsState,
    getAccountByWalletById,
    getWalletById,
    isAccountControllable,
    isAccountVersionEditable
} from '@tonkeeper/core/dist/entries/account';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { AuthKeychain } from '@tonkeeper/core/dist/entries/password';
import {
    TonWalletConfig,
    TonWalletStandard,
    WalletId,
    WalletVersion,
    WalletVersions,
    isStandardTonWallet
} from '@tonkeeper/core/dist/entries/wallet';
import { encrypt } from '@tonkeeper/core/dist/service/cryptoService';
import {
    getActiveWalletConfig,
    setActiveWalletConfig
} from '@tonkeeper/core/dist/service/wallet/configService';
import {
    createReadOnlyTonAccountByAddress,
    createStandardTonAccountByMnemonic,
    getWalletAddress
} from '@tonkeeper/core/dist/service/walletService';
import { AccountsApi, Account as TonapiAccount } from '@tonkeeper/core/dist/tonApiV2';
import { seeIfValidTonAddress } from '@tonkeeper/core/dist/utils/common';
import { useMemo } from 'react';
import { useAppContext } from '../hooks/appContext';
import { useAppSdk } from '../hooks/appSdk';
import { useAccountsStorage } from '../hooks/useStorage';
import { QueryKey, anyOfKeysParts } from '../libs/queryKey';
import { useDevSettings } from './dev';
import { getPasswordByNotification } from './mnemonic';

export const useActiveAccountQuery = () => {
    const storage = useAccountsStorage();
    return useQuery<Account | null, Error>(
        [QueryKey.account, QueryKey.wallet],
        () => {
            return storage.getActiveAccount();
        },
        {
            keepPreviousData: true
        }
    );
};

export const useActiveAccount = () => {
    const { data } = useActiveAccountQuery();
    if (!data) {
        throw new Error('No active account');
    }

    return data;
};

export const useActiveWallet = () => {
    const account = useActiveAccount();
    return account.activeTonWallet;
};

export const useActiveStandardTonWallet = () => {
    const wallet = useActiveWallet();
    if (!isStandardTonWallet(wallet)) {
        throw new Error('Wallet is not standard');
    }
    return wallet;
};

export const useMutateActiveAccount = () => {
    const storage = useAccountsStorage();
    const client = useQueryClient();
    return useMutation<void, Error, AccountId>(async accountId => {
        await storage.setActiveAccountId(accountId);
        await client.invalidateQueries(anyOfKeysParts(QueryKey.account, accountId));
    });
};

export const useMutateActiveTonWallet = () => {
    const storage = useAccountsStorage();
    const client = useQueryClient();
    return useMutation<void, Error, WalletId>(async walletId => {
        const accounts = await storage.getAccounts();
        const account = getAccountByWalletById(accounts, walletId);

        if (!account) {
            throw new Error('Account not found');
        }
        account.setActiveTonWallet(walletId);
        await storage.updateAccountInState(account);
        await storage.setActiveAccountId(account.id);
        await client.invalidateQueries(anyOfKeysParts(QueryKey.account, walletId));
    });
};

export const useMutateActiveLedgerAccountDerivation = () => {
    const storage = useAccountsStorage();
    const client = useQueryClient();
    return useMutation<void, Error, { derivationIndex: number; accountId: AccountId }>(
        async ({ accountId, derivationIndex }) => {
            const account = await storage.getAccount(accountId);

            if (!account || account.type !== 'ledger') {
                throw new Error('Account not found');
            }

            account.setActiveDerivationIndex(derivationIndex);
            const walletId = account.activeTonWallet.id;
            await storage.updateAccountInState(account);
            await storage.setActiveAccountId(account.id);
            await client.invalidateQueries(anyOfKeysParts(QueryKey.account, walletId));
        }
    );
};

export const useAddLedgerAccountDerivation = () => {
    const storage = useAccountsStorage();
    const client = useQueryClient();
    return useMutation<void, Error, { derivationIndex: number; accountId: AccountId }>(
        async ({ accountId, derivationIndex }) => {
            const account = await storage.getAccount(accountId);

            if (!account || account.type !== 'ledger') {
                throw new Error('Account not found');
            }

            account.setAddedDerivationsIndexes(
                account.addedDerivationsIndexes
                    .filter(i => i !== derivationIndex)
                    .concat(derivationIndex)
            );
            await storage.updateAccountInState(account);
            await client.invalidateQueries(anyOfKeysParts(QueryKey.account));
        }
    );
};

export const useRemoveLedgerAccountDerivation = () => {
    const storage = useAccountsStorage();
    const client = useQueryClient();
    return useMutation<void, Error, { derivationIndex: number; accountId: AccountId }>(
        async ({ accountId, derivationIndex }) => {
            const account = await storage.getAccount(accountId);

            if (!account || account.type !== 'ledger') {
                throw new Error('Account not found');
            }

            account.setAddedDerivationsIndexes(
                account.addedDerivationsIndexes.filter(i => i !== derivationIndex)
            );
            await storage.updateAccountInState(account);
            await client.invalidateQueries(anyOfKeysParts(QueryKey.account));
        }
    );
};

export const useAccountState = (id: AccountId | undefined) => {
    const accounts = useAccountsState();
    return useMemo(
        () => (id !== undefined ? (accounts || []).find(w => w.id === id) : undefined),
        [accounts, id]
    );
};

export const useControllableAccountAndWalletByWalletId = (
    id: WalletId | undefined
): { account: Account | undefined; wallet: TonWalletStandard | undefined } => {
    const accounts = useAccountsState().filter(isAccountControllable);
    return useMemo(() => {
        if (!id) {
            return {
                wallet: undefined,
                account: undefined
            };
        }
        return {
            wallet: getWalletById(accounts, id),
            account: getAccountByWalletById(accounts, id)
        };
    }, [accounts, id]);
};

export const useAccountsStateQuery = () => {
    const storage = useAccountsStorage();
    return useQuery<AccountsState, Error>(
        [QueryKey.account, QueryKey.wallets],
        () => storage.getAccounts(),
        {
            keepPreviousData: true
        }
    );
};

export const useMutateAccountsState = () => {
    const client = useQueryClient();
    const storage = useAccountsStorage();
    return useMutation<void, Error, AccountsState>(async state => {
        await storage.setAccounts(state);
        await client.invalidateQueries([QueryKey.account]);
    });
};

export const useCreateAccountReadOnly = () => {
    const sdk = useAppSdk();
    const { mutateAsync: addAccountToState } = useAddAccountToStateMutation();
    const { mutateAsync: selectAccountMutation } = useMutateActiveAccount();

    return useMutation<
        AccountTonWatchOnly,
        Error,
        {
            address: string;
            name?: string;
        }
    >(async ({ address, name }) => {
        const valid = await seeIfValidTonAddress(address);
        if (!valid) {
            throw new Error('Address is not valid.');
        }

        const account = await createReadOnlyTonAccountByAddress(sdk.storage, address, { name });

        await addAccountToState(account);
        await selectAccountMutation(account.id);
        return account;
    });
};
export const useCreateAccountMnemonic = () => {
    const sdk = useAppSdk();
    const context = useAppContext();
    const { mutateAsync: addAccountToState } = useAddAccountToStateMutation();
    const { mutateAsync: selectAccountMutation } = useMutateActiveAccount();

    return useMutation<
        AccountTonMnemonic,
        Error,
        {
            mnemonic: string[];
            password?: string;
            versions: WalletVersion[];
            selectAccount?: boolean;
        }
    >(async ({ mnemonic, password, versions, selectAccount }) => {
        const valid = await mnemonicValidate(mnemonic);
        if (!valid) {
            throw new Error('Mnemonic is not valid.');
        }

        if (sdk.keychain) {
            const account = await createStandardTonAccountByMnemonic(
                context,
                sdk.storage,
                mnemonic,
                {
                    auth: {
                        kind: 'keychain'
                    },
                    versions
                }
            );

            await sdk.keychain.setPassword(
                (account.auth as AuthKeychain).keychainStoreKey,
                mnemonic.join(' ')
            );

            await addAccountToState(account);
            if (selectAccount) {
                await selectAccountMutation(account.id);
            }
            return account;
        }

        if (!password) {
            password = await getPasswordByNotification(sdk);
        }

        const encryptedMnemonic = await encrypt(mnemonic.join(' '), password);
        const account = await createStandardTonAccountByMnemonic(context, sdk.storage, mnemonic, {
            auth: {
                kind: 'password',
                encryptedMnemonic
            },
            versions
        });

        await addAccountToState(account);
        if (selectAccount) {
            await selectAccountMutation(account.id);
        }
        return account;
    });
};

export const useAddTonWalletVersionToAccount = () => {
    const accountsStore = useAccountsStorage();
    const client = useQueryClient();

    return useMutation<
        TonWalletStandard,
        Error,
        {
            accountId: AccountId;
            version: WalletVersion;
        }
    >(async ({ accountId, version }) => {
        const account = (await accountsStore.getAccount(accountId))!;
        if (!isAccountVersionEditable(account)) {
            throw new Error('Cannot add wallet to this account');
        }
        const publicKey = account.activeTonWallet.publicKey;
        const w = getWalletAddress(publicKey, version);
        const wallet: TonWalletStandard = {
            id: w.address.toRawString(),
            rawAddress: w.address.toRawString(),
            version,
            publicKey
        };

        account.addTonWalletToActiveDerivation(wallet);
        await accountsStore.updateAccountInState(account);
        await client.invalidateQueries(anyOfKeysParts(QueryKey.account, account.id, wallet.id));
        return wallet;
    });
};

export const useRemoveTonWalletVersionFromAccount = () => {
    const storage = useAccountsStorage();
    const client = useQueryClient();

    return useMutation<
        void,
        Error,
        {
            accountId: AccountId;
            walletId: WalletId;
        }
    >(async ({ walletId, accountId }) => {
        const account = (await storage.getAccount(accountId))!;
        if (!isAccountVersionEditable(account)) {
            throw new Error('Cannot add wallet to this account');
        }
        account.removeTonWalletFromActiveDerivation(walletId);
        await storage.updateAccountInState(account);
        await client.invalidateQueries(anyOfKeysParts(QueryKey.account, account.id, walletId));
    });
};

export const useAddAccountToStateMutation = () => {
    const storage = useAccountsStorage();
    const client = useQueryClient();
    return useMutation<void, Error, Account>(async account => {
        await storage.addAccountToState(account);
        await client.invalidateQueries([QueryKey.account]);
    });
};

export const useAccountsState = () => {
    return useAccountsStateQuery().data!;
};

export const useMutateDeleteAll = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    return useMutation<void, Error, void>(async () => {
        await sdk.storage.clear();
        await client.invalidateQueries();
    });
};

export const useIsPasswordSet = () => {
    const wallets = useAccountsState();
    return (wallets || []).some(acc => acc.type === 'mnemonic' && acc.auth.kind === 'password');
};

export const useMutateLogOut = () => {
    const storage = useAccountsStorage();
    const client = useQueryClient();
    return useMutation<void, Error, AccountId>(async accountId => {
        await storage.removeAccountFromState(accountId);
        await client.invalidateQueries([QueryKey.account]);
        await client.invalidateQueries([QueryKey.pro]);
    });
};

export const useMutateRenameAccount = <T extends Account>() => {
    const client = useQueryClient();
    const storage = useAccountsStorage();

    return useMutation<T, Error, { id: WalletId; name?: string; emoji?: string }>(async form => {
        if (form.name !== undefined && form.name.length <= 0) {
            throw new Error('Missing name');
        }

        const account = (await storage.getAccount(form.id))!;
        if (form.emoji) {
            account.emoji = form.emoji;
        }

        if (form.name) {
            account.name = form.name;
        }

        await storage.updateAccountInState(account);

        await client.invalidateQueries([QueryKey.account]);

        return account.clone() as T;
    });
};

export const useWalletAccountInfo = () => {
    const wallet = useActiveWallet();
    const { api } = useAppContext();
    return useQuery<TonapiAccount, Error>([wallet.rawAddress, QueryKey.info], async () => {
        return new AccountsApi(api.tonApiV2).getAccount({
            accountId: wallet.rawAddress
        });
    });
};

export const useActiveTonNetwork = () => {
    return useDevSettings().data?.tonNetwork || Network.MAINNET;
};

export const useActiveTonWalletConfig = () => {
    const wallet = useActiveWallet();
    const sdk = useAppSdk();
    const network = useActiveTonNetwork();
    return useQuery<TonWalletConfig, Error>(
        [wallet.rawAddress, network, QueryKey.walletConfig],
        async () => getActiveWalletConfig(sdk.storage, wallet.rawAddress, network)
    );
};

export const useMutateActiveTonWalletConfig = () => {
    const wallet = useActiveWallet();
    const sdk = useAppSdk();
    const client = useQueryClient();
    const network = useActiveTonNetwork();
    return useMutation<void, Error, Partial<TonWalletConfig>>(async newConfig => {
        const config = await getActiveWalletConfig(sdk.storage, wallet.rawAddress, network);

        await setActiveWalletConfig(sdk.storage, wallet.rawAddress, network, {
            ...config,
            ...newConfig
        });

        await client.invalidateQueries({
            predicate: q => q.queryKey.includes(QueryKey.walletConfig)
        });
    });
};

export const useStandardTonWalletVersions = (publicKey?: string) => {
    const { api, fiat } = useAppContext();
    const network = useActiveTonNetwork();

    return useQuery(
        [QueryKey.walletVersions, publicKey, network],
        async () => {
            if (!publicKey) {
                return undefined;
            }
            const versions = WalletVersions.map(v => getWalletAddress(publicKey, v, network));

            const response = await new AccountsApi(api.tonApiV2).getAccounts({
                getAccountsRequest: { accountIds: versions.map(v => v.address.toRawString()) }
            });

            const walletsJettonsBalances = await Promise.all(
                versions.map(v =>
                    new AccountsApi(api.tonApiV2).getAccountJettonsBalances({
                        accountId: v.address.toRawString(),
                        currencies: [fiat],
                        supportedExtensions: ['custom_payload']
                    })
                )
            );

            return versions.map((v, index) => ({
                ...v,
                tonBalance: response.accounts[index].balance,
                hasJettons: walletsJettonsBalances[index].balances.some(
                    b => b.price?.prices && Number(b.balance) > 0
                )
            }));
        },
        {
            keepPreviousData: true
        }
    );
};

export const useTonWalletsBalances = (addresses: string[]) => {
    const { api, fiat } = useAppContext();
    const network = useActiveTonNetwork();

    return useQuery(
        [QueryKey.walletVersions, addresses, network, fiat],
        async () => {
            const response = await new AccountsApi(api.tonApiV2).getAccounts({
                getAccountsRequest: { accountIds: addresses }
            });

            const walletsJettonsBalances = await Promise.all(
                addresses.map(address =>
                    new AccountsApi(api.tonApiV2).getAccountJettonsBalances({
                        accountId: address,
                        currencies: [fiat],
                        supportedExtensions: ['custom_payload']
                    })
                )
            );

            return addresses.map((address, index) => ({
                address,
                tonBalance: response.accounts[index].balance,
                hasJettons: walletsJettonsBalances[index].balances.some(
                    b => b.price?.prices && Number(b.balance) > 0
                )
            }));
        },
        {
            keepPreviousData: true
        }
    );
};

export function useInvalidateActiveWalletQueries() {
    const account = useActiveAccount();
    const client = useQueryClient();
    return useMutation(async () => {
        const activeTonWallet = account.activeTonWallet;
        await client.invalidateQueries({
            predicate: query =>
                query.queryKey.includes(activeTonWallet.id) || query.queryKey.includes(account.id)
        });
    });
}

export function useInvalidateGlobalQueries() {
    const client = useQueryClient();
    return useMutation(async () => {
        await client.invalidateQueries(anyOfKeysParts(QueryKey.pro, QueryKey.dashboardData));
    });
}

export const useIsActiveWalletWatchOnly = () => {
    const wallet = useActiveAccount();
    return wallet.type === 'watch-only';
};
