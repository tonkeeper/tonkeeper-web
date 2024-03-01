import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProState, ProStateSubscription } from '@tonkeeper/core/dist/entries/pro';
import {
    authViaTonConnect,
    createProServiceInvoice,
    estimateProServiceInvoice,
    getBackupState,
    getProServiceTiers,
    getProState,
    logoutTonConsole,
    publishAndWaitProServiceInvoice,
    startProServiceTrial,
    setBackupState
} from '@tonkeeper/core/dist/service/proService';
import { getWalletState } from '@tonkeeper/core/dist/service/wallet/storeService';
import { ProServiceTier } from '@tonkeeper/core/src/tonConsoleApi/models/ProServiceTier';
import { useMemo } from 'react';
import { useAppContext, useWalletContext } from '../hooks/appContext';
import { useAppSdk } from '../hooks/appSdk';
import { QueryKey } from '../libs/queryKey';
import { getMnemonic, signTonConnect } from './mnemonic';

export const useProBackupState = () => {
    const sdk = useAppSdk();
    return useQuery<ProStateSubscription, Error>(
        [QueryKey.proBackup],
        () => getBackupState(sdk.storage),
        { keepPreviousData: true }
    );
};

export const useProState = () => {
    const wallet = useWalletContext();
    const sdk = useAppSdk();
    const client = useQueryClient();
    return useQuery<ProState, Error>([QueryKey.pro], async () => {
        const state = await getProState(sdk.storage, wallet);
        await setBackupState(sdk.storage, state.subscription);
        await client.invalidateQueries([QueryKey.proBackup]);
        return state;
    });
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

    const all = useQuery<ProServiceTier[], Error>([QueryKey.pro, 'plans', wallet.lang], () =>
        getProServiceTiers(wallet.lang)
    );

    const promo = useQuery<ProServiceTier[], Error>(
        [QueryKey.pro, 'promo', wallet.lang, promoCode],
        () => getProServiceTiers(wallet.lang, promoCode !== '' ? promoCode : undefined),
        { enabled: promoCode !== '' }
    );

    return useMemo<[ProServiceTier[] | undefined, string | undefined]>(() => {
        if (!promo.data) {
            return [all.data, undefined];
        } else {
            return [promo.data, promoCode];
        }
    }, [all.data, promo.data]);
};

export const useBuyProServiceMutation = () => {
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

export const useActivateTrialMutation = () => {
    const client = useQueryClient();
    const ctx = useAppContext();

    return useMutation<void, Error>(async () => {
        await startProServiceTrial((ctx.env as { tgAuthBotId: string }).tgAuthBotId);
        await client.invalidateQueries([QueryKey.pro]);
    });
};
