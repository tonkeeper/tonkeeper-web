import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProState } from '@tonkeeper/core/dist/entries/pro';
import {
    authViaTonConnect,
    createProServiceInvoice,
    estimateProServiceInvoice,
    getProServiceTiers,
    getProState,
    logoutTonConsole,
    publishAndWaitProServiceInvoice
} from '@tonkeeper/core/dist/service/proService';
import { getWalletState } from '@tonkeeper/core/dist/service/wallet/storeService';
import { ProServiceTier } from '@tonkeeper/core/src/tonConsoleApi';
import { useMemo } from 'react';
import { useAppContext, useWalletContext } from '../hooks/appContext';
import { useAppSdk } from '../hooks/appSdk';
import { QueryKey } from '../libs/queryKey';
import { getMnemonic, signTonConnect } from './mnemonic';

export const useProState = () => {
    const wallet = useWalletContext();
    const sdk = useAppSdk();
    return useQuery<ProState, Error>([QueryKey.pro], () => getProState(sdk.storage, wallet));
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

        // TODO: GET value from cookie
        await sdk.storage.set('temporary_wallet', publicKey);

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

    const all = useQuery<ProServiceTier[], Error>([QueryKey.pro, 'plans', wallet.lang], () =>
        getProServiceTiers(wallet.lang)
    );

    const promo = useQuery<ProServiceTier[], Error>(
        [QueryKey.pro, 'promo', wallet.lang, promoCode],
        () => getProServiceTiers(wallet.lang, promoCode != '' ? promoCode : undefined),
        { enabled: promoCode != '' }
    );

    return useMemo<[ProServiceTier[] | undefined, string | undefined]>(() => {
        if (!promo.data) {
            return [all.data, undefined] as const;
        } else {
            return [promo.data, promoCode] as const;
        }
    }, [all.data, promo.data]);
};

export const buyProServiceMutation = () => {
    const sdk = useAppSdk();
    const { api } = useAppContext();
    const client = useQueryClient();
    return useMutation<void, Error, { state: ProState; tierId: number | null; promoCode?: string }>(
        async data => {
            if (data.tierId === null) {
                throw new Error('missing tier');
            }
            const wallet = await getWalletState(sdk.storage, data.state.wallet.publicKey);
            if (!wallet) {
                throw new Error('Missing wallet');
            }

            const invoice = await createProServiceInvoice(data.tierId, data.promoCode);

            const estimate = await estimateProServiceInvoice(api, wallet, invoice);

            const mnemonic = await getMnemonic(sdk, data.state.wallet.publicKey);

            await publishAndWaitProServiceInvoice(api, wallet, invoice, estimate, mnemonic);

            await client.invalidateQueries([QueryKey.pro]);
        }
    );
};
