import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { AccountState } from '@tonkeeper/core/dist/entries/account';
import { WalletVersion } from '@tonkeeper/core/dist/entries/wallet';
import { accountSelectWallet, getAccountState } from '@tonkeeper/core/dist/service/accountService';
import { getWalletState } from '@tonkeeper/core/dist/service/wallet/storeService';
import { updateWalletVersion } from '@tonkeeper/core/dist/service/walletService';
import { useWalletContext } from '../hooks/appContext';
import { useAppSdk } from '../hooks/appSdk';
import { QueryKey } from '../libs/queryKey';

export const useAccountState = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    return useQuery<AccountState, Error>([QueryKey.account], async () => {
        const account = await getAccountState(sdk.storage);
        await Promise.all(
            account.publicKeys.map(key =>
                getWalletState(sdk.storage, key).then(wallet => {
                    if (wallet) {
                        client.setQueryData(
                            [QueryKey.account, QueryKey.wallet, wallet.publicKey],
                            wallet
                        );
                    }
                })
            )
        );
        return account;
    });
};

export const useMutateAccountState = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    return useMutation<void, Error, AccountState>(async state => {
        await sdk.storage.set(AppKey.ACCOUNT, state);
        await client.invalidateQueries([QueryKey.account]);
    });
};

export const useMutateActiveWallet = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    return useMutation<void, Error, string>(async publicKey => {
        await accountSelectWallet(sdk.storage, publicKey);
        await client.invalidateQueries([QueryKey.account]);
        await client.invalidateQueries([publicKey]);
    });
};

export const useMutateDeleteAll = () => {
    const sdk = useAppSdk();
    return useMutation<void, Error, void>(async () => {
        // TODO: clean remote storage by api
        await sdk.storage.clear();
    });
};

export const useMutateWalletVersion = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    const wallet = useWalletContext();
    return useMutation<void, Error, WalletVersion>(async version => {
        await updateWalletVersion(sdk.storage, wallet, version);
        await client.invalidateQueries([wallet.publicKey]);
        await client.invalidateQueries([wallet.active.rawAddress]);
        await client.invalidateQueries([QueryKey.account]);
    });
};
