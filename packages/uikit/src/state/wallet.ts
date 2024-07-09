import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    ActiveWalletConfig,
    isPasswordAuthWallet,
    isStandardTonWallet,
    StandardTonWalletState,
    WalletId,
    WalletsState,
    WalletState,
    WalletVersion,
    WalletVersions
} from '@tonkeeper/core/dist/entries/wallet';
import {
    createStandardTonWalletStateByMnemonic,
    getWalletAddress,
    updateWalletProperty
} from '@tonkeeper/core/dist/service/walletService';
import { Account, AccountsApi } from '@tonkeeper/core/dist/tonApiV2';
import { useAppContext } from '../hooks/appContext';
import { useAppSdk } from '../hooks/appSdk';
import { QueryKey } from '../libs/queryKey';
import { DefaultRefetchInterval } from './tonendpoint';
import {
    getActiveWalletConfig,
    setActiveWalletConfig
} from '@tonkeeper/core/dist/service/wallet/configService';
import { useMemo } from 'react';
import { useWalletsStorage } from '../hooks/useStorage';
import { walletsStorage } from '@tonkeeper/core/dist/service/walletsService';
import { AuthKeychain } from '@tonkeeper/core/dist/entries/password';
import { mnemonicValidate } from '@ton/crypto';
import { getPasswordByNotification } from './mnemonic';
import { encrypt } from '@tonkeeper/core/dist/service/cryptoService';
import { Network } from '@tonkeeper/core/dist/entries/network';

export const useActiveWalletQuery = () => {
    const storage = useWalletsStorage();
    return useQuery<WalletState | null, Error>(
        [QueryKey.account, QueryKey.wallet],
        () => {
            return storage.getActiveWallet();
        },
        {
            keepPreviousData: true
        }
    );
};

export const useActiveWallet = () => {
    const { data } = useActiveWalletQuery();
    if (!data) {
        throw new Error('No active wallet');
    }

    return data;
};

export const useActiveStandardTonWallet = () => {
    const wallet = useActiveWallet();

    if (!isStandardTonWallet(wallet)) {
        throw new Error('Active wallet is not standard TON');
    }

    return wallet;
};

export const useMutateActiveWallet = () => {
    const storage = useWalletsStorage();
    const client = useQueryClient();
    return useMutation<void, Error, WalletId>(async walletId => {
        await storage.setActiveWalletId(walletId);
        await client.invalidateQueries([QueryKey.account]);
        await client.invalidateQueries([walletId]);
    });
};

export const useWalletState = (id: WalletId) => {
    const wallets = useWalletsState();
    return useMemo(() => (wallets || []).find(w => w.id === id), [wallets]);
};

export const useWalletsStateQuery = () => {
    const storage = useWalletsStorage();
    return useQuery<WalletsState, Error>(
        [QueryKey.account, QueryKey.wallets],
        () => storage.getWallets(),
        {
            keepPreviousData: true
        }
    );
};

export const useMutateWalletsState = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    return useMutation<void, Error, WalletsState>(async state => {
        await walletsStorage(sdk.storage).setWallets(state);
        await client.invalidateQueries([QueryKey.account]);
    });
};

export const useCreateStandardTonWalletsByMnemonic = () => {
    const sdk = useAppSdk();
    const { api } = useAppContext();
    const { mutateAsync: addWalletsToState } = useAddWalletsToStateMutation();
    const { mutateAsync: selectWallet } = useMutateActiveWallet();

    return useMutation<
        StandardTonWalletState[],
        Error,
        {
            mnemonic: string[];
            password?: string;
            versions: WalletVersion[];
            activateFirstWallet?: boolean;
        }
    >(async ({ mnemonic, password, versions, activateFirstWallet }) => {
        const valid = await mnemonicValidate(mnemonic);
        if (!valid) {
            throw new Error('Mnemonic is not valid.');
        }

        if (sdk.keychain) {
            const states = await Promise.all(
                versions.map(version =>
                    createStandardTonWalletStateByMnemonic(api, mnemonic, {
                        auth: {
                            kind: 'keychain'
                        },
                        version
                    })
                )
            );

            await sdk.keychain.setPassword(
                (states[0].auth as AuthKeychain).keychainStoreKey,
                mnemonic.join(' ')
            );

            await addWalletsToState(states);
            if (activateFirstWallet) {
                await selectWallet(states[0].id);
            }
            return states;
        }

        if (!password) {
            password = await getPasswordByNotification(sdk);
        }

        const encryptedMnemonic = await encrypt(mnemonic.join(' '), password);
        const states = await Promise.all(
            versions.map(version =>
                createStandardTonWalletStateByMnemonic(api, mnemonic, {
                    auth: {
                        kind: 'password',
                        encryptedMnemonic
                    },
                    version
                })
            )
        );

        await addWalletsToState(states);
        if (activateFirstWallet) {
            await selectWallet(states[0].id);
        }
        return states;
    });
};

export const useAddWalletToStateMutation = () => {
    const ws = useWalletsStorage();
    const client = useQueryClient();
    return useMutation<void, Error, WalletState>(async state => {
        await ws.addWalletToState(state);
        await client.invalidateQueries([QueryKey.account]);
    });
};

export const useAddWalletsToStateMutation = () => {
    const ws = useWalletsStorage();
    const client = useQueryClient();
    return useMutation<void, Error, WalletsState>(async states => {
        await ws.addWalletsToState(states);
        await client.invalidateQueries([QueryKey.account]);
    });
};

export const useWalletsState = () => {
    return useWalletsStateQuery().data!;
};

export const useMutateDeleteAll = () => {
    const sdk = useAppSdk();
    return useMutation<void, Error, void>(async () => {
        await sdk.storage.clear();
    });
};

export const useIsPasswordSet = () => {
    const wallets = useWalletsState();
    return (wallets || []).some(isPasswordAuthWallet);
};

export const useMutateLogOut = () => {
    const storage = useWalletsStorage();
    const client = useQueryClient();
    return useMutation<void, Error, WalletId>(async walletId => {
        await storage.removeWalletFromState(walletId);
        await client.invalidateQueries([QueryKey.account]);
    });
};

export const useMutateRenameWallet = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();

    return useMutation<void, Error, { id: WalletId; name?: string; emoji?: string }>(async form => {
        if (form.name !== undefined && form.name.length <= 0) {
            throw new Error('Missing name');
        }

        const formToUpdate = {
            ...(form.emoji && { emoji: form.emoji }),
            ...(form.name && { name: form.name })
        };

        await updateWalletProperty(sdk.storage, form.id, formToUpdate);
        await client.invalidateQueries([QueryKey.account]);
    });
};

export const useMutateWalletProperty = (clearWallet = false) => {
    const wallet = useActiveWallet();
    const client = useQueryClient();
    const sdk = useAppSdk();

    return useMutation<void, Error, Partial<Pick<WalletState, 'network'>>>(async props => {
        await updateWalletProperty(sdk.storage, wallet.id, props);
        await client.invalidateQueries([QueryKey.account]);
        if (clearWallet) {
            await client.invalidateQueries([wallet.id]);
        }
    });
};

export const useWalletAccountInfo = () => {
    const wallet = useActiveWallet();
    const { api } = useAppContext();
    return useQuery<Account, Error>(
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

export const useActiveWalletConfig = () => {
    const wallet = useActiveWallet();
    const sdk = useAppSdk();
    return useQuery<ActiveWalletConfig, Error>(
        [wallet.rawAddress, wallet.network, QueryKey.walletConfig],
        async () => getActiveWalletConfig(sdk.storage, wallet.rawAddress, wallet.network)
    );
};

export const useMutateActiveWalletConfig = () => {
    const wallet = useActiveWallet();
    const sdk = useAppSdk();
    const client = useQueryClient();
    return useMutation<void, Error, Partial<ActiveWalletConfig>>(async newConfig => {
        const config = await getActiveWalletConfig(sdk.storage, wallet.rawAddress, wallet.network);

        await setActiveWalletConfig(sdk.storage, wallet.rawAddress, wallet.network, {
            ...config,
            ...newConfig
        });

        await client.invalidateQueries({
            predicate: q => q.queryKey.includes(QueryKey.walletConfig)
        });
    });
};

export const useStandardTonWalletVersions = (publicKey?: string, network = Network.MAINNET) => {
    const { api, fiat } = useAppContext();
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
