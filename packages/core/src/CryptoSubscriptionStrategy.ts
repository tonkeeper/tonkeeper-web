import {
    AuthTypes,
    CryptoSubscriptionStatuses,
    ICryptoPendingSubscription,
    ICryptoSubscriptionStrategy,
    IDisplayPlan,
    isPendingSubscription,
    isTonWalletStandard,
    ISubscriptionConfig,
    ISubscriptionFormData,
    isValidSubscription,
    NormalizedProPlans,
    ProSubscription,
    PurchaseErrors,
    PurchaseStatuses
} from './entries/pro';
import { SubscriptionSource } from './pro';
import { IAppSdk } from './AppSdk';
import {
    createProServiceInvoice,
    createRecipient,
    getNormalizedSubscription,
    getProServiceTiers
} from './service/proService';
import { AppKey } from './Keys';
import { IStorage } from './Storage';
import { Language } from './entries/language';
import { getFormattedProPrice, pickBestSubscription } from './utils/pro';

export class CryptoSubscriptionStrategy implements ICryptoSubscriptionStrategy {
    public source = SubscriptionSource.CRYPTO as const;

    constructor(private sdk: IAppSdk) {}

    async subscribe(
        formData: ISubscriptionFormData,
        config: ISubscriptionConfig
    ): Promise<PurchaseStatuses> {
        const { onOpen, api } = config;
        const { wallet, selectedPlan, tempToken, promoCode } = formData;
        const { id, formattedDisplayPrice, displayName } = selectedPlan;

        const tierId = Number(id);

        if (!tierId || !onOpen || !api || !wallet) {
            throw new Error(PurchaseErrors.PURCHASE_FAILED);
        }

        if (!isTonWalletStandard(wallet)) {
            throw new Error(PurchaseErrors.INCORRECT_WALLET_TYPE);
        }

        const result = await createProServiceInvoice(tempToken, { tierId, promoCode });

        if (result.ok === false) {
            throw new Error(result.data);
        }

        const invoice = result.data;

        const [recipient, assetAmount] = await createRecipient(api, invoice);

        return new Promise<PurchaseStatuses>(resolve => {
            const onConfirm = async (success?: boolean) => {
                if (!success) return resolve(PurchaseStatuses.CANCELED);

                const pendingSubscription: ICryptoPendingSubscription = {
                    source: SubscriptionSource.CRYPTO,
                    status: CryptoSubscriptionStatuses.PENDING,
                    valid: false,
                    displayName,
                    displayPrice: formattedDisplayPrice,
                    auth: {
                        type: AuthTypes.WALLET,
                        wallet,
                        tempToken
                    }
                };

                await this.sdk.storage.set<ICryptoPendingSubscription>(
                    AppKey.PRO_PENDING_SUBSCRIPTION,
                    pendingSubscription
                );

                resolve(PurchaseStatuses.PENDING);
            };

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
        });
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

    private async clearPendingSubscription(storage: IStorage) {
        await storage.delete(AppKey.PRO_PENDING_SUBSCRIPTION);
    }

    async getSubscription(tempToken: string | null): Promise<ProSubscription> {
        const storage = this.sdk.storage;
        const authService = this.sdk.authService;

        const pendingSubscription: ICryptoPendingSubscription | null = await storage.get(
            AppKey.PRO_PENDING_SUBSCRIPTION
        );

        const mainToken = await authService.getToken();
        const targetToken = tempToken ?? pendingSubscription?.auth?.tempToken ?? null;

        const [currentSubscription, targetSubscription] = await Promise.all([
            getNormalizedSubscription(storage, mainToken),
            getNormalizedSubscription(storage, targetToken)
        ]);

        if (tempToken && isValidSubscription(targetSubscription)) {
            await authService.setToken(tempToken);
            await this.clearPendingSubscription(storage);

            return targetSubscription;
        }

        if (isPendingSubscription(pendingSubscription)) {
            return {
                ...pendingSubscription,
                valid: Boolean(currentSubscription?.valid)
            };
        }

        const bestSubscription = pickBestSubscription(currentSubscription, targetSubscription);

        if (isValidSubscription(bestSubscription)) {
            await this.clearPendingSubscription(storage);
        }

        return bestSubscription;
    }
}
