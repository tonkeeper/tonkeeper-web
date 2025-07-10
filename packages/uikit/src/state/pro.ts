import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import {
    IDisplayPlan,
    IosPendingSubscription,
    IosPurchaseStatuses,
    IosSubscriptionStatuses,
    isIosStrategy,
    isProductId,
    NormalizedProPlans,
    ProState,
    ProStateAuthorized,
    ProSubscription
} from '@tonkeeper/core/dist/entries/pro';
import { RecipientData } from '@tonkeeper/core/dist/entries/send';
import { isStandardTonWallet, TonWalletStandard } from '@tonkeeper/core/dist/entries/wallet';
import {
    authViaTonConnect,
    createProServiceInvoice,
    createRecipient,
    getBackupState,
    getProState,
    logoutTonConsole,
    ProAuthTokenService,
    retryProService,
    saveIapPurchase,
    setBackupState,
    startProServiceTrial,
    waitProServiceInvoice
} from '@tonkeeper/core/dist/service/proService';
import { InvoicesInvoice } from '@tonkeeper/core/dist/tonConsoleApi';
import { OpenAPI, SubscriptionSource } from '@tonkeeper/core/dist/pro';
import { useMemo } from 'react';
import { useAppContext } from '../hooks/appContext';
import { useAppSdk, useAppTargetEnv } from '../hooks/appSdk';
import { useTranslation } from '../hooks/translation';
import { useAccountsStorage } from '../hooks/useStorage';
import { anyOfKeysParts, QueryKey } from '../libs/queryKey';
import { useUserLanguage } from './language';
import { signTonConnectOver } from './mnemonic';
import {
    getAccountByWalletById,
    getWalletById,
    isAccountTonWalletStandard
} from '@tonkeeper/core/dist/entries/account';
import { useActiveApi } from './wallet';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { useToast } from '../hooks/useNotification';
import { useAnalyticsTrack } from '../hooks/analytics';
import { assertUnreachable } from '@tonkeeper/core/dist/utils/types';
import { parsePrice } from '../libs/pro';

export type FreeProAccess = {
    code: string;
    validUntil: Date;
};

export const useFreeProAccessAvailable = () => {
    const { mainnetConfig } = useAppContext();
    const env = useAppTargetEnv();

    return useMemo<FreeProAccess | null>(() => {
        if (!mainnetConfig.enhanced_acs_pmob || env !== 'mobile') {
            return null;
        }
        const data = mainnetConfig.enhanced_acs_pmob;
        if (!data.code || !data.acs_until) {
            return null;
        }

        const validUntil = new Date(data.acs_until * 1000);
        if (validUntil < new Date()) {
            return null;
        }

        return {
            code: data.code,
            validUntil
        };
    }, [mainnetConfig.enhanced_acs_pmob, env]);
};

export const useMutateIsFreeProAccessActivate = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    const toast = useToast();
    const { t } = useTranslation();
    const track = useAnalyticsTrack();

    return useMutation<void, Error, boolean>(async isActive => {
        await sdk.storage.set(AppKey.PRO_FREE_ACCESS_ACTIVE, isActive);
        await client.invalidateQueries([QueryKey.pro]);

        if (isActive) {
            toast(t('free_pro_access_activated_toast'));

            track('free_pro_access_activated');
        }
    });
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
};

export const useProState = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    const authService = useProAuthTokenService();
    const isFreeProAccessAvailable = useFreeProAccessAvailable();

    return useQuery<ProState, Error>([QueryKey.pro, isFreeProAccessAvailable], async () => {
        const state = await getProState(authService, sdk.storage);

        await setBackupState(sdk.storage, state.subscription);
        await client.invalidateQueries([QueryKey.proBackup]);

        return state;
    });
};

export const useManageSubscription = () => {
    const sdk = useAppSdk();

    return useMutation<void, Error, void>(async () => {
        if (!isIosStrategy(sdk.subscriptionStrategy)) {
            throw new Error('This is not an iOS subscription strategy');
        }

        await sdk.subscriptionStrategy.manageSubscriptions();
    });
};

export const useProSubscriptionPurchase = () => {
    const sdk = useAppSdk();
    const { data } = useProState();
    const client = useQueryClient();

    return useMutation<IosPurchaseStatuses, Error, IDisplayPlan>(async selectedPlan => {
        const { id, displayPrice, displayName } = selectedPlan;

        if (!isIosStrategy(sdk.subscriptionStrategy)) {
            throw new Error('This is not an iOS subscription strategy');
        }

        if (!isProductId(id)) {
            throw new Error('This is not an iOS subscription strategy');
        }

        const subscription = await sdk.subscriptionStrategy?.subscribe(id);

        if (subscription.status === IosPurchaseStatuses.CANCELED) {
            return IosPurchaseStatuses.CANCELED;
        }

        const originalTransactionId = subscription?.originalTransactionId;

        if (!originalTransactionId) {
            throw new Error('Failed to subscribe');
        }

        const savingResult = await saveIapPurchase(String(originalTransactionId));

        if (!savingResult.ok) {
            const pendingSubscription: IosPendingSubscription = {
                ...subscription,
                displayName,
                displayPrice,
                source: SubscriptionSource.IOS,
                status: IosSubscriptionStatuses.PENDING,
                valid: false,
                isTrial: false,
                usedTrial: data?.subscription?.usedTrial ?? false
            };

            await sdk.storage.set<ProState>(AppKey.PRO_PENDING_STATE, {
                authorizedWallet: data?.authorizedWallet || null,
                subscription: pendingSubscription
            });
            await client.invalidateQueries(anyOfKeysParts(QueryKey.pro));

            return IosPurchaseStatuses.PENDING;
        }

        await client.invalidateQueries(anyOfKeysParts(QueryKey.pro));

        return IosPurchaseStatuses.SUCCESS;
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
    const sdk = useAppSdk();
    const { data: lang } = useUserLanguage();

    return useQuery<NormalizedProPlans, Error>(
        [QueryKey.pro, QueryKey.plans, lang, promoCode ?? null],
        async () => {
            const strategy = sdk.subscriptionStrategy;

            if (!strategy) {
                throw new Error('pro_subscription_load_failed');
            }

            if (strategy.source === SubscriptionSource.IOS) {
                const plans = await strategy.getAllProductsInfo();
                const sortedPlans = [...plans].sort((a, b) => {
                    return parsePrice(a.displayPrice) - parsePrice(b.displayPrice);
                });

                return { source: SubscriptionSource.IOS, plans: sortedPlans };
            }

            if (strategy.source === SubscriptionSource.CRYPTO) {
                const [plans, verifiedCode] = await strategy.getAllProductsInfo(lang, promoCode);

                return {
                    source: SubscriptionSource.CRYPTO,
                    plans: plans ?? [],
                    promoCode: verifiedCode
                };
            }

            return assertUnreachable(strategy);
        },
        {}
    );
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
    const authService = useProAuthTokenService();

    return useMutation<void, Error, ConfirmState>(async data => {
        await waitProServiceInvoice(data.invoice);
        await retryProService(authService, sdk.storage);
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
