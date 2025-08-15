import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    AuthTypes,
    CryptoSubscriptionStatuses,
    IIosPurchaseResult,
    IOriginalTransactionInfo,
    ISupportData,
    isIosStrategy,
    isPaidActiveSubscription,
    ISubscriptionFormData,
    NormalizedProPlans,
    ProSubscription,
    PurchaseStatuses,
    ISelectedTargetAuth
} from '@tonkeeper/core/dist/entries/pro';
import { isStandardTonWallet } from '@tonkeeper/core/dist/entries/wallet';
import {
    authViaSeedPhrase,
    authViaTonConnect,
    getBackupState,
    getProSupportUrl,
    logoutTonConsole,
    ProAuthViaSeedPhraseParams,
    setBackupState,
    startProServiceTrial
} from '@tonkeeper/core/dist/service/proService';
import { useAppContext } from '../hooks/appContext';
import { useAppSdk, useAppTargetEnv } from '../hooks/appSdk';
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
import { useAtom } from '../libs/useAtom';
import { atom } from '@tonkeeper/core/dist/entries/atom';
import { useProConfirmNotification } from '../components/modals/ProConfirmNotificationControlled';

export const selectedTargetAuthAtom = atom<ISelectedTargetAuth | null>(null);

export const useTrialAvailability = () => {
    const sdk = useAppSdk();
    const platform = useAppTargetEnv();

    return useQuery<boolean, Error>([QueryKey.pro, QueryKey.trialAvailability], async () => {
        const isUsedTrial = Boolean(await sdk.storage.get(AppKey.PRO_USED_TRIAL));

        return platform !== 'tablet' && !isUsedTrial;
    });
};

export const useSupport = () => {
    const sdk = useAppSdk();
    const { mainnetConfig } = useAppContext();
    const { data: subscription } = useProState();

    return useQuery<ISupportData, Error>(
        [QueryKey.pro, QueryKey.supportToken, subscription?.valid],
        async () => getProSupportUrl(await sdk.authService.getToken()),
        {
            initialData: {
                url: mainnetConfig.directSupportUrl ?? '',
                isPriority: false
            },
            staleTime: 0,
            cacheTime: 0
        }
    );
};

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

    return useQuery<ProSubscription, Error>(
        [QueryKey.pro],
        async () => {
            if (!sdk.subscriptionStrategy) {
                throw new Error('Missing SubscriptionStrategy');
            }

            const subscription = await sdk.subscriptionStrategy.getSubscription(
                selectedTargetAuthAtom?.value?.tempToken ?? null
            );

            await setBackupState(sdk.storage, subscription);
            await client.invalidateQueries([QueryKey.proBackup]);

            return subscription;
        },
        {
            keepPreviousData: true,
            suspense: true,
            refetchInterval: s => (s?.status === CryptoSubscriptionStatuses.PENDING ? 1000 : false)
        }
    );
};

export const useCurrentSubscriptionInfo = () => {
    const sdk = useAppSdk();

    return useQuery<IIosPurchaseResult[], Error>(
        [QueryKey.currentIosSubscriptionInfo],
        async () => {
            if (!isIosStrategy(sdk.subscriptionStrategy)) {
                throw new Error('This is not an iOS subscription strategy');
            }

            const result = await sdk.subscriptionStrategy.getCurrentSubscriptionInfo();

            return result || [];
        }
    );
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

export const useSelectWalletForProMutation = () => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const api = useActiveApi();
    const client = useQueryClient();

    const [, setTargetAuth] = useAtom(selectedTargetAuthAtom);
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

        const tempToken = await authViaTonConnect(
            api,
            wallet,
            signTonConnectOver({ sdk, accountId: account.id, wallet, t })
        );

        setTargetAuth({
            type: AuthTypes.WALLET,
            wallet,
            tempToken
        });

        await client.invalidateQueries([QueryKey.pro]);
    });
};

export const useAutoAuthMutation = () => {
    const api = useActiveApi();
    const { data: subscription } = useProState();
    const client = useQueryClient();
    const [, setTargetAuth] = useAtom(selectedTargetAuthAtom);

    return useMutation<void, Error, ProAuthViaSeedPhraseParams>(async authData => {
        try {
            if (isPaidActiveSubscription(subscription)) return;

            const tempToken = await authViaSeedPhrase(api, authData);

            setTargetAuth({
                type: AuthTypes.WALLET,
                wallet: authData.wallet,
                tempToken
            });

            await client.invalidateQueries([QueryKey.pro]);
        } catch (e) {
            console.error('Pro auto auth failed', e);
        }
    });
};

export const useProLogout = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();

    return useMutation(async () => {
        await logoutTonConsole(sdk.authService);

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

            return strategy.getAllProductsInfo(lang, promoCode);
        }
    );
};

export const useOriginalTransactionInfo = () => {
    const sdk = useAppSdk();

    return useQuery<IOriginalTransactionInfo | null, Error>(
        [QueryKey.originalTransactionId],
        async () => {
            if (!isIosStrategy(sdk.subscriptionStrategy)) {
                throw new Error('This is not an iOS subscription strategy');
            }

            const originalTxInfo = await sdk.subscriptionStrategy.getOriginalTransactionId();

            return originalTxInfo || null;
        }
    );
};

export const useProPurchaseMutation = () => {
    const sdk = useAppSdk();
    const api = useActiveApi();
    const client = useQueryClient();
    const { onOpen } = useProConfirmNotification();

    return useMutation<PurchaseStatuses, Error, ISubscriptionFormData>(async formData => {
        if (!sdk.subscriptionStrategy) {
            throw new Error('Missing subscription strategy!');
        }

        const status = await sdk.subscriptionStrategy.subscribe(formData, {
            api,
            onOpen
        });

        if (status === PurchaseStatuses.PENDING || status === PurchaseStatuses.SUCCESS) {
            await client.invalidateQueries([QueryKey.pro]);
        }

        return status;
    });
};

export const useActivateTrialMutation = () => {
    const sdk = useAppSdk();
    const ctx = useAppContext();
    const client = useQueryClient();
    const {
        i18n: { language }
    } = useTranslation();

    return useMutation<string, Error>(async () => {
        const token = await startProServiceTrial(
            (ctx.env as { tgAuthBotId: string }).tgAuthBotId,
            language
        );

        await sdk.authService.setToken(token);
        await sdk.storage.set<boolean>(AppKey.PRO_USED_TRIAL, true);
        await client.invalidateQueries([QueryKey.pro]);

        return token;
    });
};
