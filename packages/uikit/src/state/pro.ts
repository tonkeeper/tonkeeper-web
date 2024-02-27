import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { localizationText } from '@tonkeeper/core/dist/entries/language';
import { ProState } from '@tonkeeper/core/dist/entries/pro';
import {
    authViaTonConnect,
    getProState,
    logoutTonConsole
} from '@tonkeeper/core/dist/service/proService';
import { getWalletState } from '@tonkeeper/core/dist/service/wallet/storeService';
import { Lang, ProServiceService, ProServiceTier } from '@tonkeeper/core/src/tonConsoleApi';
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

export const useProPlans = (promoCode?: string) => {
    const wallet = useWalletContext();
    return useQuery<ProServiceTier[], Error>(
        [QueryKey.pro, 'plans', wallet.lang, promoCode],
        async () => {
            const { items } = await ProServiceService.getProServiceTiers(
                localizationText(wallet.lang) as Lang,
                promoCode
            );
            return items;
        },
        {
            keepPreviousData: true
        }
    );
};
