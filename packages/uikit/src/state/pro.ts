import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import {
    AuthTypes,
    IDisplayPlan,
    type IIosPurchaseResult,
    IOriginalTransactionInfo,
    IosPurchaseStatuses,
    isIosStrategy,
    isPaidSubscription,
    isProductId,
    NormalizedProPlans,
    ProState,
    ProStateWallet,
    ProSubscription
} from '@tonkeeper/core/dist/entries/pro';
import { RecipientData } from '@tonkeeper/core/dist/entries/send';
import { isStandardTonWallet, TonWalletStandard } from '@tonkeeper/core/dist/entries/wallet';
import {
    authViaSeedPhrase,
    authViaTonConnect,
    createProServiceInvoice,
    createRecipient,
    getBackupState,
    getProState,
    logoutTonConsole,
    ProAuthTokenService,
    ProAuthTokenType,
    retryProService,
    saveIapPurchase,
    setBackupState,
    startProServiceTrial,
    waitProServiceInvoice,
    withTargetAuthToken
} from '@tonkeeper/core/dist/service/proService';
import { InvoicesInvoice } from '@tonkeeper/core/dist/tonConsoleApi';
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
import { assertUnreachable } from '@tonkeeper/core/dist/utils/types';
import { parsePrice } from '../libs/pro';
import { IAuthViaSeedPhraseData } from '@tonkeeper/core/dist/entries/password';

type FreeProAccess = {
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

export const useTrialAvailability = () => {
    const sdk = useAppSdk();
    const platform = useAppTargetEnv();

    return useQuery<boolean, Error>([QueryKey.pro], async () => {
        const isUsedTrial = Boolean(await sdk.storage.get(AppKey.PRO_USED_TRIAL));
        const isMobilePromo = Boolean(await sdk.storage.get(AppKey.PRO_FREE_ACCESS_ACTIVE));

        return platform !== 'tablet' && !isMobilePromo && !isUsedTrial;
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
        }
    };
};

export const useProState = () => {
    const sdk = useAppSdk();
    const env = useAppTargetEnv();
    const client = useQueryClient();
    const authService = useProAuthTokenService();
    const isFreeProAccessAvailable = useFreeProAccessAvailable();

    return useQuery<ProState, Error>([QueryKey.pro], async () => {
        const isFreeMobileTrialActive = Boolean(
            await sdk.storage.get<boolean>(AppKey.PRO_FREE_ACCESS_ACTIVE)
        );

        const { validUntil } = isFreeProAccessAvailable ?? {};
        const isPromo = env === 'mobile' && isFreeMobileTrialActive && validUntil;
        const promoExpirationDate = isPromo && validUntil > new Date() ? validUntil : null;

        const state = await getProState({ authService, sdk, promoExpirationDate });

        await setBackupState(sdk.storage, state.current);
        await client.invalidateQueries([QueryKey.proBackup]);

        return state;
    });
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

export const useProSubscriptionPurchase = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    const authService = useProAuthTokenService();

    return useMutation<IosPurchaseStatuses, Error, IDisplayPlan>(async selectedPlan => {
        const { id } = selectedPlan;

        if (!isIosStrategy(sdk.subscriptionStrategy) || !isProductId(id)) {
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

        const savingResult = await saveIapPurchase(authService, String(originalTransactionId));

        if (!savingResult.ok) {
            throw new Error('Failed to subscribe');
        }

        await client.invalidateQueries([QueryKey.pro]);

        return IosPurchaseStatuses.SUCCESS;
    });
};

export const useSelectWalletForProMutation = () => {
    const sdk = useAppSdk();
    const api = useActiveApi();
    const { t } = useTranslation();
    const client = useQueryClient();
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

        const state = await sdk.storage.get<ProState>(AppKey.PRO_PENDING_STATE);

        await sdk.storage.set<ProState>(AppKey.PRO_PENDING_STATE, {
            current: state?.current ?? null,
            target: {
                auth: {
                    type: AuthTypes.WALLET,
                    wallet: {
                        publicKey: wallet.publicKey,
                        rawAddress: wallet.rawAddress
                    }
                }
            }
        });

        await client.invalidateQueries([QueryKey.pro]);
    });
};

export const useAutoAuthMutation = () => {
    const api = useActiveApi();
    const { data: proState } = useProState();
    const client = useQueryClient();
    const authService = useProAuthTokenService();

    return useMutation<void, Error, IAuthViaSeedPhraseData>(async authData => {
        if (isPaidSubscription(proState?.current)) return;

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
    const authService = useProAuthTokenService();

    return useMutation<
        ConfirmState,
        Error,
        { wallet: ProStateWallet; tierId: number | null; promoCode?: string }
    >(async data => {
        const tierId = data.tierId;
        if (tierId === null) {
            throw new Error('missing tier');
        }

        return withTargetAuthToken(authService, async () => {
            const wallet = (await ws.getAccounts())
                .flatMap(a => a.allTonWallets)
                .find(w => w.id === data.wallet.rawAddress);
            if (!wallet || !isStandardTonWallet(wallet)) {
                throw new Error('Missing wallet');
            }

            const invoice = await createProServiceInvoice(tierId, data.promoCode);
            const [recipient, assetAmount] = await createRecipient(api, invoice);

            return {
                invoice,
                wallet,
                recipient,
                assetAmount
            };
        });
    });
};

export const useWaitInvoiceMutation = () => {
    const client = useQueryClient();
    const sdk = useAppSdk();
    const authService = useProAuthTokenService();

    return useMutation<void, Error, ConfirmState>(async data => {
        await waitProServiceInvoice(data.invoice);

        await withTargetAuthToken(authService, async () => {
            await retryProService({ authService, sdk, promoExpirationDate: null });
        });

        await client.invalidateQueries([QueryKey.pro]);
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
