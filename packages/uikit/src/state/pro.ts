import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import {
    AuthTypes,
    hasWalletAuth,
    IDisplayPlan,
    type IIosPurchaseResult,
    IOriginalTransactionInfo,
    IosPendingSubscription,
    IosPurchaseStatuses,
    IosSubscriptionStatuses,
    isIosStrategy,
    isProductId,
    NormalizedProPlans,
    ProState,
    ProStateWallet,
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
import { assertUnreachable } from '@tonkeeper/core/dist/utils/types';
import { parsePrice } from '../libs/pro';

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
    const client = useQueryClient();
    const authService = useProAuthTokenService();

    return useQuery<ProState, Error>([QueryKey.pro], async () => {
        const state = await getProState(authService, sdk);

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
    const { data: proState } = useProState();
    const targetSubscription = proState?.target;

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
            if (!hasWalletAuth(targetSubscription)) {
                throw new Error('Failed to subscribe');
            }

            const pendingSubscription: IosPendingSubscription = {
                ...subscription,
                displayName,
                displayPrice,
                source: SubscriptionSource.IOS,
                status: IosSubscriptionStatuses.PENDING,
                valid: false,
                usedTrial: targetSubscription?.usedTrial ?? false,
                auth: targetSubscription.auth
            };

            await sdk.storage.set<ProState>(AppKey.PRO_PENDING_STATE, {
                current: pendingSubscription,
                target: pendingSubscription
            });

            await client.invalidateQueries([QueryKey.pro]);

            return IosPurchaseStatuses.PENDING;
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
            await retryProService(authService, sdk);
        });

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
