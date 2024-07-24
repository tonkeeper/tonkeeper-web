import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Account,
    AccountId,
    AccountsState,
    AccountTonMnemonic,
    accountWithAddedTonWallet,
    accountWithUpdatedActiveTonWalletId,
    accountWithUpdatedTonWallet,
    getAccountActiveTonWallet,
    getAccountAllTonWallets,
    getWalletById,
    isAccountTonMnemonic,
    isStandardTonWallet,
    isW5Version,
    TonWalletConfig,
    TonWalletStandard,
    WalletId,
    WalletVersion,
    WalletVersions
} from '@tonkeeper/core/dist/entries/wallet';
import {
    createStandardTonAccountByMnemonic,
    getFallbackTonStandardWalletEmoji,
    getFallbackWalletName,
    getWalletAddress,
    updateAccountProperty
} from '@tonkeeper/core/dist/service/walletService';
import { Account as TonapiAccount, AccountsApi } from '@tonkeeper/core/dist/tonApiV2';
import { useAppContext } from '../hooks/appContext';
import { useAppSdk } from '../hooks/appSdk';
import { QueryKey } from '../libs/queryKey';
import { DefaultRefetchInterval, isV5R1Enabled } from './tonendpoint';
import { useMemo } from 'react';
import { useAccountsStorage } from '../hooks/useStorage';
import { mnemonicValidate } from '@ton/crypto';
import { getPasswordByNotification } from './mnemonic';
import { encrypt } from '@tonkeeper/core/dist/service/cryptoService';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { useDevSettings } from './dev';
import { AuthKeychain } from '@tonkeeper/core/dist/entries/password';
import {
    getActiveWalletConfig,
    setActiveWalletConfig
} from '@tonkeeper/core/dist/service/wallet/configService';

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
    return getAccountActiveTonWallet(account);
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
        await client.invalidateQueries([QueryKey.account]);
        await client.invalidateQueries([accountId]);
    });
};

export const useMutateActiveTonWallet = () => {
    const storage = useAccountsStorage();
    const client = useQueryClient();
    return useMutation<void, Error, WalletId>(async walletId => {
        const accounts = await storage.getAccounts();
        const account = accounts.find(a => getAccountAllTonWallets(a).some(w => w.id === walletId));

        if (!account) {
            throw new Error('Account not found');
        }
        await storage.updateAccountInState(accountWithUpdatedActiveTonWalletId(account, walletId));
        await storage.setActiveAccountId(account.id);
        await client.invalidateQueries([QueryKey.account]);
        await client.invalidateQueries([walletId]);
    });
};

export const useAccountState = (id: AccountId) => {
    const accounts = useAccountsState();
    return useMemo(() => (accounts || []).find(w => w.id === id), [accounts]);
};

export const useWalletState = (id: WalletId): TonWalletStandard | undefined => {
    const accounts = useAccountsState();
    return useMemo(() => getWalletById(accounts, id), [accounts]);
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
            const account = await createStandardTonAccountByMnemonic(context, mnemonic, {
                auth: {
                    kind: 'keychain'
                },
                versions
            });

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
        const account = await createStandardTonAccountByMnemonic(context, mnemonic, {
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

export const useAddTonWalletVersionToActiveAccount = () => {
    const accountsStore = useAccountsStorage();
    const account = useActiveAccount();

    return useMutation<
        TonWalletStandard,
        Error,
        {
            version: WalletVersion;
        }
    >(async ({ version }) => {
        const publicKey = getAccountActiveTonWallet(account).publicKey;
        const w = getWalletAddress(publicKey, version);
        const wallet: TonWalletStandard = {
            id: w.address.toRawString(),
            rawAddress: w.address.toRawString(),
            version,
            publicKey,
            name: getFallbackWalletName(w.address),
            emoji: getFallbackTonStandardWalletEmoji(publicKey, version)
        };

        await accountsStore.updateAccountInState(accountWithAddedTonWallet(account, wallet));
        return wallet;
    });
};

export const useRenameTonWallet = () => {
    const accountsStore = useAccountsStorage();
    const account = useActiveAccount();

    return useMutation<
        TonWalletStandard,
        Error,
        {
            id: WalletId;
            name?: string;
            emoji?: string;
        }
    >(async ({ id, name, emoji }) => {
        const wallet = getAccountAllTonWallets(account).find(w => w.id === id);
        if (!wallet) {
            throw new Error('Wallet to rename not found');
        }

        const newWallet = {
            ...wallet,
            name: name || wallet.name,
            emoji: emoji || wallet.emoji
        };

        await accountsStore.updateAccountInState(accountWithUpdatedTonWallet(account, newWallet));
        return wallet;
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
    return useMutation<void, Error, void>(async () => {
        await sdk.storage.clear();
    });
};

export const useIsPasswordSet = () => {
    const wallets = useAccountsState();
    return (wallets || []).some(acc => isAccountTonMnemonic(acc) && acc.auth.kind === 'password');
};

export const useMutateLogOut = () => {
    const storage = useAccountsStorage();
    const client = useQueryClient();
    return useMutation<void, Error, AccountId>(async accountId => {
        await storage.removeAccountFromState(accountId);
        await client.invalidateQueries([QueryKey.account]);
    });
};

export const useMutateRenameAccount = <T extends Account>() => {
    const sdk = useAppSdk();
    const client = useQueryClient();

    return useMutation<T, Error, { id: WalletId; name?: string; emoji?: string }>(async form => {
        if (form.name !== undefined && form.name.length <= 0) {
            throw new Error('Missing name');
        }

        const formToUpdate = {
            ...(form.emoji && { emoji: form.emoji }),
            ...(form.name && { name: form.name })
        };

        const newAccount = await updateAccountProperty(sdk.storage, form.id, formToUpdate);
        await client.invalidateQueries([QueryKey.account]);

        return newAccount as T;
    });
};

export const useWalletAccountInfo = () => {
    const wallet = useActiveWallet();
    const { api } = useAppContext();
    return useQuery<TonapiAccount, Error>(
        [wallet.rawAddress, QueryKey.info],
        async () => {
            return new AccountsApi(api.tonApiV2).getAccount({
                accountId: wallet.rawAddress
            });
        },
        {
            refetchInterval: DefaultRefetchInterval,
            refetchIntervalInBackground: true,
            refetchOnWindowFocus: true,
            keepPreviousData: true
        }
    );
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
    const { api, fiat, config } = useAppContext();
    const { data: devSettings } = useDevSettings();
    const isV5Enabled = isV5R1Enabled(config) || devSettings?.enableV5;
    const network = useActiveTonNetwork();

    return useQuery(
        [QueryKey.walletVersions, publicKey, network, isV5Enabled],
        async () => {
            if (!publicKey) {
                return undefined;
            }
            const versions = WalletVersions.filter(v => isV5Enabled || !isW5Version(v)).map(v =>
                getWalletAddress(publicKey, v, network)
            );

            const response = await new AccountsApi(api.tonApiV2).getAccounts({
                getAccountsRequest: { accountIds: versions.map(v => v.address.toRawString()) }
            });

            const walletsJettonsBalances = await Promise.all(
                versions.map(v =>
                    new AccountsApi(api.tonApiV2).getAccountJettonsBalances({
                        accountId: v.address.toRawString(),
                        currencies: [fiat]
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

export function useInvalidateActiveWalletQueries() {
    const account = useActiveAccount();
    const client = useQueryClient();
    return useMutation(async () => {
        const activeTonWallet = getAccountActiveTonWallet(account);
        await client.invalidateQueries({
            predicate: query =>
                query.queryKey.includes(activeTonWallet.id) || query.queryKey.includes(account.id)
        });
    });
}
