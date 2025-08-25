import {
    AuthTypes,
    CryptoSubscriptionStatuses,
    ICryptoPendingSubscription,
    ICryptoStrategyConfig,
    ICryptoSubscriptionStrategy as ICryptoStrategy,
    IDisplayPlan,
    isPendingSubscription,
    isTonWalletStandard,
    ISubscriptionFormData,
    isValidSubscription,
    NormalizedProPlans,
    ProSubscription,
    PurchaseErrors,
    PurchaseStatuses
} from './entries/pro';
import { SubscriptionSource } from './pro';
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
import { BaseSubscriptionStrategy as BaseStrategy } from './BaseSubscriptionStrategy';

export class CryptoSubscriptionStrategy extends BaseStrategy implements ICryptoStrategy {
    public source = SubscriptionSource.CRYPTO as const;

    constructor(storage: IStorage, private readonly config: ICryptoStrategyConfig) {
        super(storage);
    }

    async getToken(): Promise<string | null> {
        return this.authTokenService.getToken();
    }

    async subscribe(formData: ISubscriptionFormData): Promise<PurchaseStatuses> {
        const { onProConfirmOpen, api } = this.config;
        const { wallet, selectedPlan, tempToken, promoCode } = formData;
        const { id, formattedDisplayPrice, displayName } = selectedPlan;

        const tierId = Number(id);

        if (!tierId || !onProConfirmOpen || !api || !wallet) {
            throw new Error(PurchaseErrors.PURCHASE_FAILED);
        }

        if (!isTonWalletStandard(wallet)) {
            throw new Error(PurchaseErrors.INCORRECT_WALLET_TYPE);
        }

        const result = await createProServiceInvoice(tempToken, { tierId, promoCode });

        if (!result.ok) {
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

                await this.storage.set<ICryptoPendingSubscription>(
                    AppKey.PRO_PENDING_SUBSCRIPTION,
                    pendingSubscription
                );

                resolve(PurchaseStatuses.PENDING);
            };

            onProConfirmOpen({
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

    private async clearPendingSubscription(storage: IStorage) {
        await storage.delete(AppKey.PRO_PENDING_SUBSCRIPTION);
    }

    async getSubscription(tempToken: string | null): Promise<ProSubscription> {
        const pendingSubscription: ICryptoPendingSubscription | null = await this.storage.get(
            AppKey.PRO_PENDING_SUBSCRIPTION
        );

        const mainToken = await this.authTokenService.getToken();
        const targetToken = tempToken ?? pendingSubscription?.auth?.tempToken ?? null;

        const [currentSubscription, targetSubscription] = await Promise.all([
            getNormalizedSubscription(this.storage, mainToken),
            getNormalizedSubscription(this.storage, targetToken)
        ]);

        if (tempToken && isValidSubscription(targetSubscription)) {
            await this.authTokenService.setToken(tempToken);
            await this.clearPendingSubscription(this.storage);

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
            await this.clearPendingSubscription(this.storage);
        }

        return bestSubscription;
    }

    async getAllProductsInfoCore(lang?: Language, promoCode?: string): Promise<NormalizedProPlans> {
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
    }
}
