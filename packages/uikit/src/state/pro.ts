import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { ProState, ProStateAuthorized, ProSubscription } from '@tonkeeper/core/dist/entries/pro';
import { RecipientData } from '@tonkeeper/core/dist/entries/send';
import { TonWalletStandard, isStandardTonWallet } from '@tonkeeper/core/dist/entries/wallet';
import {
    authViaTonConnect,
    createProServiceInvoice,
    createRecipient,
    getBackupState,
    getProServiceTiers,
    getProState,
    logoutTonConsole,
    retryProService,
    setBackupState,
    startProServiceTrial,
    waitProServiceInvoice
} from '@tonkeeper/core/dist/service/proService';
import { InvoicesInvoice } from '@tonkeeper/core/dist/tonConsoleApi';
import { ProServiceTier } from '@tonkeeper/core/src/tonConsoleApi/models/ProServiceTier';
import { useMemo } from 'react';
import { useAppContext } from '../hooks/appContext';
import { useAppSdk } from '../hooks/appSdk';
import { useTranslation } from '../hooks/translation';
import { useAccountsStorage } from '../hooks/useStorage';
import { QueryKey } from '../libs/queryKey';
import { useUserLanguage } from './language';
import { signTonConnectOver } from './mnemonic';
import { useCheckTouchId } from './password';
import {
    getAccountByWalletById,
    getWalletById,
    isAccountTonWalletStandard
} from '@tonkeeper/core/dist/entries/account';
import { useActiveApi } from './wallet';

export const useProBackupState = () => {
    const sdk = useAppSdk();
    return useQuery<ProSubscription, Error>(
        [QueryKey.proBackup],
        () => getBackupState(sdk.storage),
        { keepPreviousData: true }
    );
};

export const useProState = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    return useQuery<ProState, Error>([QueryKey.pro], async () => {
        const state = await getProState(sdk.storage);
        await setBackupState(sdk.storage, state.subscription);
        await client.invalidateQueries([QueryKey.proBackup]);
        return state;
    });
};

export const useSelectWalletForProMutation = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    const api = useActiveApi();
    const { t } = useTranslation();
    const { mutateAsync: checkTouchId } = useCheckTouchId();
    const accountsStorage = useAccountsStorage();

    return useMutation<void, Error, string>(async walletId => {
        const accounts = (await accountsStorage.getAccounts()).filter(isAccountTonWalletStandard);
        const account = getAccountByWalletById(accounts, walletId);

        if (!account) {
            throw new Error('Account not found');
        }

        const wallet = getWalletById(accounts, walletId);

        if (!wallet) {
            throw new Error('Missing wallet state');
        }

        if (!isStandardTonWallet(wallet)) {
            throw new Error("Can't use non-standard ton wallet for pro auth");
        }

        await authViaTonConnect(
            api,
            wallet,
            signTonConnectOver({ sdk, accountId: account.id, wallet, t, checkTouchId })
        );

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
    const { data: lang } = useUserLanguage();

    const all = useQuery<ProServiceTier[], Error>([QueryKey.pro, 'plans', lang], () =>
        getProServiceTiers(lang)
    );

    const promo = useQuery<ProServiceTier[], Error>(
        [QueryKey.pro, 'promo', lang, promoCode],
        () => getProServiceTiers(lang, promoCode !== '' ? promoCode : undefined),
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

export interface ConfirmState {
    invoice: InvoicesInvoice;
    recipient: RecipientData;
    assetAmount: AssetAmount;
    wallet: TonWalletStandard;
}

export const useCreateInvoiceMutation = () => {
    const ws = useAccountsStorage();
    const api = useActiveApi();
    return useMutation<
        ConfirmState,
        Error,
        { state: ProStateAuthorized; tierId: number | null; promoCode?: string }
    >(async data => {
        if (data.tierId === null) {
            throw new Error('missing tier');
        }

        const wallet = (await ws.getAccounts())
            .flatMap(a => a.allTonWallets)
            .find(w => w.id === data.state.authorizedWallet.rawAddress);
        if (!wallet || !isStandardTonWallet(wallet)) {
            throw new Error('Missing wallet');
        }

        const invoice = await createProServiceInvoice(data.tierId, data.promoCode);
        const [recipient, assetAmount] = await createRecipient(api, invoice);
        return {
            invoice,
            wallet,
            recipient,
            assetAmount
        };
    });
};

export const useWaitInvoiceMutation = () => {
    const client = useQueryClient();
    const sdk = useAppSdk();
    return useMutation<void, Error, ConfirmState>(async data => {
        await waitProServiceInvoice(data.invoice);
        await retryProService(sdk.storage);
        await client.invalidateQueries([QueryKey.pro]);
    });
};

export const useActivateTrialMutation = () => {
    const client = useQueryClient();
    const ctx = useAppContext();
    const {
        i18n: { language }
    } = useTranslation();

    return useMutation<boolean, Error>(async () => {
        const result = await startProServiceTrial(
            (ctx.env as { tgAuthBotId: string }).tgAuthBotId,
            language
        );
        await client.invalidateQueries([QueryKey.pro]);
        return result;
    });
};
