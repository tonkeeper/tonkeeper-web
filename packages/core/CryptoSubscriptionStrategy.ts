import {
    AuthTypes,
    CryptoPendingSubscription,
    CryptoSubscriptionStatuses,
    ICryptoSubscriptionStrategy,
    IDisplayPlan,
    isTonWalletStandard,
    ISubscriptionConfig,
    ISubscriptionFormData,
    NormalizedProPlans,
    PurchaseStatuses
} from './dist/entries/pro';
import { SubscriptionSource } from './dist/pro';
import {
    createProServiceInvoice,
    createRecipient,
    getProServiceTiers,
    ProAuthTokenType
} from './dist/service/proService';
import { AppKey } from './dist/Keys';
import { Language } from './dist/entries/language';
import { getFormattedProPrice } from './dist/utils/pro';
import { getNormalizedSubscription } from './dist/service/proService';
import {
    isPendingSubscription,
    isValidSubscription,
    isProSubscription,
    ProSubscription
} from './dist/entries/pro';
import { IStorage } from './dist/Storage';
import { IAppSdk } from './dist/AppSdk';

export class CryptoSubscriptionStrategy implements ICryptoSubscriptionStrategy {
    public source = SubscriptionSource.CRYPTO as const;

    constructor(private sdk: IAppSdk) {}

    async subscribe(
        formData: ISubscriptionFormData,
        config: ISubscriptionConfig
    ): Promise<PurchaseStatuses> {
        const { onOpen, api } = config;
        const { wallet, selectedPlan } = formData;
        const { id, formattedDisplayPrice, displayName } = selectedPlan;

        const tierId = Number(id);

        if (!tierId || !onOpen || !api || !wallet) {
            throw new Error('Missing subscribe data!');
        }

        return await new Promise(resolve =>
            this.sdk.authService.withTokenContext(ProAuthTokenType.TEMP, async () => {
                if (!isTonWalletStandard(wallet)) {
                    throw new Error('Incorrect wallet type!');
                }

                const onConfirm = async (success?: boolean) => {
                    if (success) {
                        const pendingSubscription: CryptoPendingSubscription = {
                            source: SubscriptionSource.CRYPTO,
                            status: CryptoSubscriptionStatuses.PENDING,
                            valid: false,
                            displayName,
                            displayPrice: formattedDisplayPrice,
                            auth: {
                                type: AuthTypes.WALLET,
                                wallet
                            }
                        };

                        await this.sdk.storage.set<CryptoPendingSubscription>(
                            AppKey.PRO_PENDING_SUBSCRIPTION,
                            pendingSubscription
                        );

                        resolve(PurchaseStatuses.PENDING);
                    } else {
                        return resolve(PurchaseStatuses.CANCELED);
                    }
                };

                const invoice = await createProServiceInvoice(tierId, formData.promoCode);
                const [recipient, assetAmount] = await createRecipient(api, invoice);

                onOpen({
                    confirmState: {
                        invoice,
                        wallet,
                        recipient,
                        assetAmount
                    },
                    onConfirm,
                    onCancel: () => {
                        resolve(PurchaseStatuses.CANCELED);
                    }
                });
            })
        );
    }

    async getAllProductsInfo(lang?: Language, promoCode?: string): Promise<NormalizedProPlans> {
        try {
            const verifiedPromoCode = promoCode !== '' ? promoCode : undefined;
            const plans = await getProServiceTiers(lang, verifiedPromoCode);

            const normalizedPlans: IDisplayPlan[] = plans.map(plan => ({
                id: String(plan.id),
                displayName: plan.name,
                displayPrice: plan.amount,
                subscriptionPeriod: 'year',
                formattedDisplayPrice: getFormattedProPrice(plan.amount, true)
            }));

            return { plans: normalizedPlans, verifiedPromoCode };
        } catch (e) {
            console.error('Failed to fetch products info:', e);
            return { plans: undefined, verifiedPromoCode: undefined };
        }
    }

    clearProAuthBreadCrumbs = async (storage: IStorage) => {
        await storage.delete(AppKey.PRO_PENDING_SUBSCRIPTION);
    };

    async getSubscription(): Promise<ProSubscription> {
        const storage = this.sdk.storage;
        const authService = this.sdk.authService;

        await authService.attachToken(ProAuthTokenType.MAIN);

        const currentSubscription = await getNormalizedSubscription(
            authService,
            storage,
            ProAuthTokenType.MAIN
        );

        const targetSubscription = await getNormalizedSubscription(
            authService,
            storage,
            ProAuthTokenType.TEMP
        );

        const pendingSubscription: CryptoPendingSubscription | null = await storage.get(
            AppKey.PRO_PENDING_SUBSCRIPTION
        );

        if (isProSubscription(targetSubscription) && isValidSubscription(targetSubscription)) {
            await authService.promoteToken(ProAuthTokenType.TEMP, ProAuthTokenType.MAIN);

            await this.clearProAuthBreadCrumbs(storage);

            return targetSubscription;
        }

        if (isPendingSubscription(pendingSubscription)) {
            return {
                ...pendingSubscription,
                valid: Boolean(currentSubscription?.valid)
            };
        }

        if (isValidSubscription(currentSubscription)) {
            await this.clearProAuthBreadCrumbs(storage);

            return currentSubscription;
        }

        if (isProSubscription(currentSubscription)) {
            return currentSubscription;
        }

        if (isProSubscription(targetSubscription)) {
            return targetSubscription;
        }

        await authService.setToken(ProAuthTokenType.MAIN, null);

        return null;
    }
}
