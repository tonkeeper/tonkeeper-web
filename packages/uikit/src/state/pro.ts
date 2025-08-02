import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    AuthTypes,
    CryptoPendingSubscription,
    CryptoSubscriptionStatuses,
    IOriginalTransactionInfo,
    isIosStrategy,
    isPaidSubscription,
    ISubscriptionFormData,
    NormalizedProPlans,
    ProSubscription,
    PurchaseStatuses,
    WalletAuth
} from '@tonkeeper/core/dist/entries/pro';
import { isStandardTonWallet } from '@tonkeeper/core/dist/entries/wallet';
import {
    authViaSeedPhrase,
    authViaTonConnect,
    getBackupState,
    getProState,
    getProSupportUrl,
    logoutTonConsole,
    ProAuthTokenService,
    ProAuthTokenType,
    setBackupState,
    startProServiceTrial
} from '@tonkeeper/core/dist/service/proService';
import { OpenAPI, SubscriptionSource } from '@tonkeeper/core/dist/pro';
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
import { IAuthViaSeedPhraseData } from '@tonkeeper/core/dist/entries/password';
import { useAtom } from '../libs/useAtom';
import { atom } from '@tonkeeper/core/dist/entries/atom';
import { useProConfirmNotification } from '../components/modals/ProConfirmNotificationControlled';

type FreeProAccess = {
    code: string;
    validUntil: Date;
};

export const selectedTargetAuth = atom<WalletAuth | null>(null);

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

export const useTrialAvailability = () => {
    const sdk = useAppSdk();
    const platform = useAppTargetEnv();

    return useQuery<boolean, Error>([QueryKey.pro], async () => {
        const isUsedTrial = Boolean(await sdk.storage.get(AppKey.PRO_USED_TRIAL));
        const isMobilePromo = Boolean(await sdk.storage.get(AppKey.PRO_FREE_ACCESS_ACTIVE));

        return platform !== 'tablet' && !isMobilePromo && !isUsedTrial;
    });
};

export const useProSupportUrl = () => {
    return useQuery<string | null, Error>([QueryKey.pro, QueryKey.supportToken], async () =>
        getProSupportUrl()
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

export const useProAuthTokenService = (): ProAuthTokenService => {
    const storage = useAppSdk().storage;

    const keyMap: Record<ProAuthTokenType, AppKey> = {
        [ProAuthTokenType.MAIN]: AppKey.PRO_AUTH_TOKEN,
        [ProAuthTokenType.TEMP]: AppKey.PRO_TEMP_AUTH_TOKEN
    };

    return {
        async attachToken(type = ProAuthTokenType.MAIN) {
            const token = await storage.get<string>(keyMap[type]);

            OpenAPI.TOKEN = token ?? undefined;
        },

        async setToken(type: ProAuthTokenType, token: string | null) {
            await storage.set(keyMap[type], token);

            if (type === ProAuthTokenType.MAIN) {
                OpenAPI.TOKEN = token ?? undefined;
            }
        },

        async getToken(type: ProAuthTokenType): Promise<string | null> {
            return storage.get<string>(keyMap[type]);
        },

        async promoteToken(from: ProAuthTokenType, to: ProAuthTokenType) {
            const token = await storage.get<string>(keyMap[from]);

            if (token) {
                await storage.set(keyMap[to], token);
                await storage.delete(keyMap[from]);

                if (to === ProAuthTokenType.MAIN) {
                    OpenAPI.TOKEN = token;
                }
            }
        },

        async withTokenContext<T>(type: ProAuthTokenType, fn: () => Promise<T>): Promise<T> {
            const originalToken = OpenAPI.TOKEN;

            const token = await storage.get<string>(keyMap[type]);
            OpenAPI.TOKEN = token ?? undefined;

            try {
                return await fn();
            } finally {
                OpenAPI.TOKEN = originalToken;
            }
        }
    };
};

export const useProState = () => {
    const sdk = useAppSdk();
    const env = useAppTargetEnv();
    const client = useQueryClient();
    const authService = useProAuthTokenService();
    const isFreeProAccessAvailable = useFreeProAccessAvailable();

    return useQuery<ProSubscription, Error>(
        [QueryKey.pro],
        async () => {
            const isFreeMobileTrialActive = Boolean(
                await sdk.storage.get<boolean>(AppKey.PRO_FREE_ACCESS_ACTIVE)
            );

            const { validUntil } = isFreeProAccessAvailable ?? {};
            const isPromo = env === 'mobile' && isFreeMobileTrialActive && validUntil;
            const promoExpirationDate = isPromo && validUntil > new Date() ? validUntil : null;

            const state = await getProState({ authService, sdk, promoExpirationDate });

            await setBackupState(sdk.storage, state);
            await client.invalidateQueries([QueryKey.proBackup]);

            return state;
        },
        {
            keepPreviousData: true,
            suspense: true,
            refetchInterval: s => (s?.status === CryptoSubscriptionStatuses.PENDING ? 1000 : false)
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

    const [, setTargetAuth] = useAtom(selectedTargetAuth);
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

        setTargetAuth({
            type: AuthTypes.WALLET,
            wallet
        });

        await client.invalidateQueries([QueryKey.pro]);
    });
};

export const useAutoAuthMutation = () => {
    const api = useActiveApi();
    const { data: subscription } = useProState();
    const client = useQueryClient();
    const authService = useProAuthTokenService();

    return useMutation<void, Error, IAuthViaSeedPhraseData>(async authData => {
        if (isPaidSubscription(subscription)) return;

        await authViaSeedPhrase(api, authService, authData);

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
    const ws = useAccountsStorage();
    const [targetAuth] = useAtom(selectedTargetAuth);
    const authService = useProAuthTokenService();

    return useMutation<PurchaseStatuses, Error, ISubscriptionFormData>(async formData => {
        if (!sdk.subscriptionStrategy) {
            throw new Error('Missing subscription strategy!');
        }

        const onConfirm = async (success?: boolean) => {
            if (!success) return;

            if (!targetAuth) {
                throw new Error('Missing wallet auth for pending subscription');
            }

            const isUsedTrial = Boolean(await sdk.storage.get(AppKey.PRO_USED_TRIAL));

            const pendingSubscription: CryptoPendingSubscription = {
                source: SubscriptionSource.CRYPTO,
                status: CryptoSubscriptionStatuses.PENDING,
                valid: false,
                usedTrial: isUsedTrial,
                displayName: formData.selectedPlan.displayName,
                displayPrice: formData.selectedPlan.formattedDisplayPrice,
                auth: targetAuth
            };

            await sdk.storage.set<CryptoPendingSubscription>(
                AppKey.PRO_PENDING_SUBSCRIPTION,
                pendingSubscription
            );
        };

        const status = await sdk.subscriptionStrategy.subscribe(formData, {
            authService,
            api,
            ws,
            onOpen,
            onConfirm,
            targetAuth
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

    const authService = useProAuthTokenService();

    return useMutation<boolean, Error>(async () => {
        const result = await startProServiceTrial(
            authService,
            (ctx.env as { tgAuthBotId: string }).tgAuthBotId,
            language
        );

        if (!result) {
            throw new Error('Failed to activate trial');
        }

        await sdk.storage.set<boolean>(AppKey.PRO_USED_TRIAL, true);
        await client.invalidateQueries([QueryKey.pro]);

        return result;
    });
};
