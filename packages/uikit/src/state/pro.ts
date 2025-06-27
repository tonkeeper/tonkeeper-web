import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import {
    IosSubscriptionStatuses,
    ProductIds,
    ProSubscription,
    SubscriptionSources
} from '@tonkeeper/core/dist/entries/pro';
import { RecipientData } from '@tonkeeper/core/dist/entries/send';
import { isStandardTonWallet, TonWalletStandard } from '@tonkeeper/core/dist/entries/wallet';
import {
    authViaTonConnect,
    createProServiceInvoice,
    createRecipient,
    getBackupState,
    getProServiceTiers,
    getProState,
    logoutTonConsole,
    ProAuthTokenService,
    retryProService,
    setBackupState,
    startProServiceTrial,
    waitProServiceInvoice
} from '@tonkeeper/core/dist/service/proService';
import { InvoicesInvoice, OpenAPI } from '@tonkeeper/core/dist/tonConsoleApi';
import { ProServiceTier } from '@tonkeeper/core/src/tonConsoleApi/models/ProServiceTier';
import { useMemo } from 'react';
import { useAppSdk } from '../hooks/appSdk';
import { useTranslation } from '../hooks/translation';
import { useAccountsStorage } from '../hooks/useStorage';
import { QueryKey } from '../libs/queryKey';
import { useUserLanguage } from './language';
import { signTonConnectOver } from './mnemonic';
import {
    getAccountByWalletById,
    getWalletById,
    isAccountTonWalletStandard
} from '@tonkeeper/core/dist/entries/account';
import { useActiveApi } from './wallet';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { useAppContext } from '../hooks/appContext';

export type FreeProAccess = {
    code: string;
    validUntil: Date;
};

export const useProBackupState = () => {
    const sdk = useAppSdk();
    return useQuery<ProSubscription, Error>(
        [QueryKey.proBackup],
        () => getBackupState(sdk.storage),
        { keepPreviousData: true }
    );
};

export const useProAuthTokenService = (): ProAuthTokenService => {
    const storage = useAppSdk().storage;

    return useMemo(() => {
        return {
            async attachToken() {
                const token = await storage.get<string>(AppKey.PRO_AUTH_TOKEN);
                OpenAPI.TOKEN = token ?? undefined;
            },
            async onTokenUpdated(token: string | null) {
                await storage.set(AppKey.PRO_AUTH_TOKEN, token);
                return this.attachToken();
            }
        };
    }, [storage]);
};

export const useProSubscription = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    const authService = useProAuthTokenService();

    return useQuery<ProSubscription, Error>([QueryKey.pro], async () => {
        const subscription = await getProState(authService);

        await setBackupState(sdk.storage, subscription);
        await client.invalidateQueries([QueryKey.proBackup]);

        return subscription;
    });
};

export const useProSubscriptionPurchase = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    // const authService = useProAuthTokenService();

    return useMutation<ProSubscription, Error, ProductIds>(async productId => {
        const subscription = await sdk.subscription?.subscribe(productId);

        alert(subscription?.originalTransactionId);

        if (subscription?.originalTransactionId === undefined) {
            throw new Error('Failed to subscribe');
        }

        // const updatedSubscription = await saveIapPurchase(
        //     authService,
        //     subscription.originalTransactionId
        // );

        const updatedSubscription = await new Promise<ProSubscription>((resolve, reject) => {
            setTimeout(
                () =>
                    // reject(
                    //     new Error(
                    //         'This is a mock implementation, please use real subscription service'
                    //     )
                    // ),
                    resolve({
                        source: SubscriptionSources.IOS,
                        isActive: true,
                        expiresAt: 123123,
                        originalTransactionId: subscription?.originalTransactionId ?? 'unknown',
                        status: IosSubscriptionStatuses.ACTIVE
                    }),
                1000
            );
        });

        // await setBackupState(sdk.storage, updatedSubscription);
        // await client.invalidateQueries([QueryKey.proBackup]);

        return updatedSubscription;
    });
};

export const useSelectWalletForProMutation = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    const api = useActiveApi();
    const { t } = useTranslation();
    const accountsStorage = useAccountsStorage();
    const authService = useProAuthTokenService();

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
            authService,
            api,
            wallet,
            signTonConnectOver({ sdk, accountId: account.id, wallet, t })
        );

        await client.invalidateQueries([QueryKey.pro]);
    });
};

export const useProLogout = () => {
    const client = useQueryClient();
    const authService = useProAuthTokenService();

    return useMutation(async () => {
        await logoutTonConsole(authService);
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
    // const ws = useAccountsStorage();
    const api = useActiveApi();

    return useMutation<
        ConfirmState,
        Error,
        { state: any; tierId: number | null; promoCode?: string }
    >(async data => {
        if (data.tierId === null) {
            throw new Error('missing tier');
        }

        const wallet = {} as TonWalletStandard;
        /*
            Get an authorized wallet from storage
            const wallet = (await ws.getAccounts())
                .flatMap(a => a.allTonWallets)
                .find(w => w.id === data.state.authorizedWallet.rawAddress);
            if (!wallet || !isStandardTonWallet(wallet)) {
                throw new Error('Missing wallet');
            }
        */
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
    const authService = useProAuthTokenService();

    return useMutation<void, Error, ConfirmState>(async data => {
        await waitProServiceInvoice(data.invoice);
        await retryProService(authService);
        await client.invalidateQueries([QueryKey.pro]);
    });
};

export const useActivateTrialMutation = () => {
    const client = useQueryClient();
    const ctx = useAppContext();
    const {
        i18n: { language }
    } = useTranslation();
    const authService = useProAuthTokenService();

    return useMutation<boolean, Error>(async () => {
        const result = await startProServiceTrial(
            authService,
            (ctx.env as { tgAuthBotId: string }).tgAuthBotId,
            language
        );
        await client.invalidateQueries([QueryKey.pro]);
        return result;
    });
};
