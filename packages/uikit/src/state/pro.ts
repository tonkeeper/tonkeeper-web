import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { IAppSdk } from '@tonkeeper/core/dist/AppSdk';
import { ProState, ProStateWallet } from '@tonkeeper/core/dist/entries/pro';
import {
    authViaTonConnect,
    getProState,
    logoutTonConsole
} from '@tonkeeper/core/dist/service/proService';
import { getWalletState } from '@tonkeeper/core/dist/service/wallet/storeService';
import { useWalletContext } from '../hooks/appContext';
import { useAppSdk } from '../hooks/appSdk';
import { QueryKey } from '../libs/queryKey';
import { signTonConnect } from './mnemonic';

export const useProState = () => {
    const sdk = useAppSdk();
    const wallet = useWalletContext();
    return useQuery<ProState, Error>([QueryKey.pro], () => getProState(sdk.storage, wallet));
};

const login = async (sdk: IAppSdk, publicKey: string) => {
    const state = await getWalletState(sdk.storage, publicKey);
    if (!state) {
        throw new Error('Missing wallet state');
    }
    await authViaTonConnect(state, signTonConnect(sdk, publicKey));
};
export const useSelectWalletMutation = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    return useMutation<void, Error, string>(async publicKey => {
        try {
            await logoutTonConsole();
        } catch (e) {
            console.warn(e);
        }
        await login(sdk, publicKey);
        await client.invalidateQueries([QueryKey.pro]);
    });
};

export const useLoginTonConsole = (wallet: ProStateWallet) => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    return useMutation<void, Error>(async () => {
        await login(sdk, wallet.publicKey);
        await client.invalidateQueries([QueryKey.pro]);
    });
};
