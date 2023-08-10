import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TronWalletState } from '@tonkeeper/core/dist/entries/wallet';
import {
    getTronWalletState,
    importTronWallet
} from '@tonkeeper/core/dist/service/tron/tronService';
import { setWalletState } from '@tonkeeper/core/dist/service/wallet/storeService';
import { TronApi, TronBalance, TronBalances } from '@tonkeeper/core/dist/tronApi';
import { useAppContext, useWalletContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { QueryKey } from '../../libs/queryKey';
import { getWalletPassword } from '../password';
import { DefaultRefetchInterval } from '../tonendpoint';

enum TronKeys {
    state,
    balance
}

export const useTronWalletState = (enabled = true) => {
    const sdk = useAppSdk();
    const { tronApi } = useAppContext();
    const wallet = useWalletContext();
    const client = useQueryClient();
    return useQuery<TronWalletState, Error>(
        [wallet.publicKey, QueryKey.tron, wallet.network, TronKeys.state],
        async () => {
            if (wallet.tron) {
                return getTronWalletState(tronApi, wallet.tron, wallet.network);
            }

            const password = await getWalletPassword(sdk, 'confirm');
            const tron = await importTronWallet(sdk.storage, tronApi, wallet, password);

            const result = await getTronWalletState(tronApi, tron, wallet.network);

            client.invalidateQueries([QueryKey.account, QueryKey.wallet]);
            return result;
        },
        { enabled }
    );
};

export const useTronBalances = () => {
    const { tronApi } = useAppContext();
    const wallet = useWalletContext();

    return useQuery<TronBalances, Error>(
        [wallet.publicKey, QueryKey.tron, wallet.network, TronKeys.balance, wallet.tron],
        async () => {
            const sdk = new TronApi(tronApi);

            if (wallet.tron) {
                const { walletAddress } = await getTronWalletState(
                    tronApi,
                    wallet.tron,
                    wallet.network
                );
                return sdk.getWalletBalances({
                    walletAddress
                });
            } else {
                const { tokens } = await sdk.getSettings();
                return {
                    balances: tokens.map(token => ({ token, weiAmount: '0' }))
                };
            }
        },
        {
            refetchInterval: DefaultRefetchInterval,
            refetchIntervalInBackground: true,
            refetchOnWindowFocus: true,
            keepPreviousData: true
        }
    );
};

export const useTronBalance = (tron: TronWalletState, address: string | undefined) => {
    const { tronApi } = useAppContext();
    const wallet = useWalletContext();

    return useQuery<TronBalance, Error>([wallet.publicKey, QueryKey.tron, address], async () => {
        if (!address) {
            throw new Error('missing token address');
        }
        const sdk = new TronApi(tronApi);

        const { balances } = await sdk.getWalletBalances({
            walletAddress: tron.walletAddress
        });

        const balance = balances.find(item => item.token.address === address);
        if (!balance) {
            throw new Error('missing token balance');
        }

        return balance;
    });
};

export const useCleanUpTronStore = () => {
    const wallet = useWalletContext();
    const sdk = useAppSdk();
    const client = useQueryClient();

    return useMutation(async () => {
        // eslint-disable-next-line unused-imports/no-unused-vars
        const { tron, ...rest } = wallet;
        if (wallet.tron) {
            await setWalletState(sdk.storage, rest);
            await client.invalidateQueries();
        }
    });
};
