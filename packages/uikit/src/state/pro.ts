import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProPlan, ProState } from '@tonkeeper/core/dist/entries/pro';
import {
    authViaTonConnect,
    getProState,
    logoutTonConsole,
    maybeCreateProProject
} from '@tonkeeper/core/dist/service/proService';
import { getWalletState } from '@tonkeeper/core/dist/service/wallet/storeService';
import { toNano } from 'ton-core';
import { useWalletContext } from '../hooks/appContext';
import { useAppSdk } from '../hooks/appSdk';
import { QueryKey } from '../libs/queryKey';
import { signTonConnect } from './mnemonic';

export const useProState = () => {
    const wallet = useWalletContext();
    return useQuery<ProState, Error>([QueryKey.pro], () => getProState(wallet));
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
        const state = await getWalletState(sdk.storage, publicKey);
        if (!state) {
            throw new Error('Missing wallet state');
        }
        await authViaTonConnect(state, signTonConnect(sdk, publicKey));
        await maybeCreateProProject(state);
        await client.invalidateQueries([QueryKey.pro]);
    });
};

export const useProLogout = () => {
    const client = useQueryClient();
    return useMutation(async () => {
        await logoutTonConsole();
        await client.invalidateQueries([QueryKey.pro]);
    });
};

export const useProPlans = () => {
    return useQuery<ProPlan[], Error>([QueryKey.pro, 'plans'], () => {
        return [
            {
                id: '1',
                name: 'Monthly Individual Package',
                price: toNano('13.37').toString()
            },
            {
                id: '2',
                name: 'Yearly Individual Package',
                price: toNano('133.7').toString()
            }
        ];
    });
};
