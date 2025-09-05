import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    AuthTypes,
    CryptoSubscriptionStatuses,
    ExtensionSubscriptionStatuses,
    IDisplayPlan,
    IIosPurchaseResult,
    IOriginalTransactionInfo,
    isIosStrategy,
    isPaidActiveSubscription,
    ISubscriptionFormData,
    ISupportData,
    ProSubscription,
    PurchaseStatuses
} from '@tonkeeper/core/dist/entries/pro';
import { isStandardTonWallet } from '@tonkeeper/core/dist/entries/wallet';
import {
    authViaSeedPhrase,
    authViaTonConnect,
    getBackupState,
    getProSupportUrl,
    ProAuthViaSeedPhraseParams,
    setBackupState,
    startProServiceTrial
} from '@tonkeeper/core/dist/service/proService';
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
import { useActiveApi, useActiveConfig } from './wallet';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { useAtom } from '../libs/useAtom';
import { subscriptionFormTempAuth$ } from '@tonkeeper/core/dist/ProAuthTokenService';
import { SubscriptionSource } from '@tonkeeper/core/dist/pro';

export const useTrialAvailability = () => {
    const sdk = useAppSdk();
    const platform = useAppTargetEnv();
    const config = useActiveConfig();

    return useQuery<boolean, Error>(
        [QueryKey.pro, QueryKey.trialAvailability, config.pro_trial_tg_bot_id],
        async () => {
            const isUsedTrial = Boolean(await sdk.storage.get(AppKey.PRO_USED_TRIAL));
            const botIdIsSet = !!config.pro_trial_tg_bot_id;

            return platform !== 'tablet' && !isUsedTrial && botIdIsSet;
        }
    );
};

export const useSupport = () => {
    const sdk = useAppSdk();
    const { mainnetConfig } = useAppContext();
    const { data: subscription } = useProState();

    return useQuery<ISupportData, Error>(
        [QueryKey.pro, QueryKey.supportToken, subscription?.valid],
        async () => getProSupportUrl(await sdk.subscriptionService.getToken()),
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
            try {
                const subscription = await sdk.subscriptionService.getSubscription(
                    subscriptionFormTempAuth$?.value?.tempToken ?? null
                );

                await setBackupState(sdk.storage, subscription);
                await client.invalidateQueries([QueryKey.proBackup]);

                return subscription;
            } catch (e) {
                console.error('Pro state failed: ', e);

                return null;
            }
        },
        {
            suspense: true,
            keepPreviousData: true,
            refetchInterval: s =>
                s?.status === CryptoSubscriptionStatuses.PENDING ||
                s?.status === ExtensionSubscriptionStatuses.PENDING
                    ? 1000
                    : false
        }
    );
};

export const useCurrentSubscriptionInfo = () => {
    const sdk = useAppSdk();

    return useQuery<IIosPurchaseResult[], Error>(
        [QueryKey.currentIosSubscriptionInfo],
        async () => {
            const iosStrategy = sdk.subscriptionService.getStrategy(SubscriptionSource.IOS);

            if (!isIosStrategy(iosStrategy)) {
                throw new Error('This is not an iOS subscription strategy');
            }

            const result = await iosStrategy.getCurrentSubscriptionInfo();

            return result || [];
        }
    );
};

export const useManageSubscription = () => {
    const sdk = useAppSdk();

    return useMutation<void, Error, void>(async () => {
        const iosStrategy = sdk.subscriptionService.getStrategy(SubscriptionSource.IOS);

        if (!isIosStrategy(iosStrategy)) {
            throw new Error('This is not an iOS subscription strategy');
        }

        await iosStrategy.manageSubscriptions();
    });
};

export const useSelectWalletForProMutation = () => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const api = useActiveApi();
    const client = useQueryClient();

    const [, setTargetAuth] = useAtom(subscriptionFormTempAuth$);
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
    const [, setTargetAuth] = useAtom(subscriptionFormTempAuth$);

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
        await sdk.subscriptionService.logout();

        await client.invalidateQueries(anyOfKeysParts(QueryKey.pro));
    });
};

export const useProPlans = (source: SubscriptionSource) => {
    const sdk = useAppSdk();
    const { data: lang } = useUserLanguage();

    return useQuery<IDisplayPlan[], Error>(
        [QueryKey.pro, QueryKey.plans, lang, source],
        async () => sdk.subscriptionService.getAllProductsInfo(source, lang),
        {
            initialData: [],
            staleTime: 0
        }
    );
};

export const useOriginalTransactionInfo = () => {
    const sdk = useAppSdk();

    return useQuery<IOriginalTransactionInfo | null, Error>(
        [QueryKey.originalTransactionId],
        async () => {
            const iosStrategy = sdk.subscriptionService.getStrategy(SubscriptionSource.IOS);

            if (!isIosStrategy(iosStrategy)) {
                throw new Error('This is not an iOS subscription strategy');
            }

            const originalTxInfo = await iosStrategy.getOriginalTransactionId();

            return originalTxInfo || null;
        }
    );
};

export const useProPurchaseMutation = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();

    return useMutation<
        PurchaseStatuses,
        Error,
        { source: SubscriptionSource; formData: ISubscriptionFormData }
    >(async ({ source, formData }) => {
        const status = await sdk.subscriptionService.subscribe(source, formData);

        if (status === PurchaseStatuses.PENDING || status === PurchaseStatuses.SUCCESS) {
            await client.invalidateQueries([QueryKey.pro]);
        }

        return status;
    });
};

export const useActivateTrialMutation = () => {
    const sdk = useAppSdk();
    const config = useActiveConfig();
    const client = useQueryClient();
    const {
        i18n: { language }
    } = useTranslation();

    return useMutation<string, Error>(async () => {
        if (config.pro_trial_tg_bot_id === undefined) {
            throw new Error('Pro trial tg bot id is not set');
        }

        const token = await startProServiceTrial(config.pro_trial_tg_bot_id, language);

        await sdk.subscriptionService.activateTrial(token);
        await client.invalidateQueries([QueryKey.pro]);

        return token;
    });
};
