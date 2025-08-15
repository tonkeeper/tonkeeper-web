import { registerPlugin } from '@capacitor/core';
import {
    IDisplayPlan,
    IIosPurchaseResult,
    IIosSubscriptionStrategy,
    ISubscriptionFormData,
    IOriginalTransactionInfo,
    IProductInfo,
    NormalizedProPlans,
    isProductId,
    ProSubscription,
    isProSubscription
} from '@tonkeeper/core/dist/entries/pro';
import {
    IosEnvironmentTypes,
    PurchaseStatuses,
    ProductIds
} from '@tonkeeper/core/dist/entries/pro';
import { SubscriptionSource } from '@tonkeeper/core/dist/pro';
import { getFormattedProPrice, pickBestSubscription } from '@tonkeeper/core/dist/utils/pro';
import {
    getNormalizedSubscription,
    saveIapPurchase
} from '@tonkeeper/core/dist/service/proService';
import { IAppSdk } from '@tonkeeper/core/dist/AppSdk';

interface ISubscriptionPlugin {
    subscribe(options: { productId: ProductIds }): Promise<IIosPurchaseResult>;
    getAllProductsInfo(options: {
        productIds: ProductIds[];
    }): Promise<{ products: IProductInfo[] }>;
    getOriginalTransactionId(): Promise<IOriginalTransactionInfo>;
    manageSubscriptions(): Promise<void>;
    getCurrentSubscriptionInfo(): Promise<{
        subscriptions: Array<IIosPurchaseResult>;
    }>;
}

const SubscriptionPlugin = registerPlugin<ISubscriptionPlugin>('Subscription', {
    web: () => ({
        async subscribe(options: { productId: ProductIds }): Promise<IIosPurchaseResult> {
            return new Promise<IIosPurchaseResult>(resolve => {
                setTimeout(() => {
                    const now = new Date();
                    const purchaseDate = now.toISOString();

                    const oneMonthLater = new Date(now);
                    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

                    const oneYearLater = new Date(now);
                    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

                    const expirationDate = (
                        options.productId === ProductIds.MONTHLY ? oneMonthLater : oneYearLater
                    ).toISOString();

                    resolve({
                        status: PurchaseStatuses.SUCCESS,
                        originalTransactionId: 2000000953417084,
                        environment: IosEnvironmentTypes.SANDBOX,
                        productId: options.productId,
                        purchaseDate,
                        expirationDate,
                        revocationDate: null,
                        isUpgraded: false
                    });
                }, 1000);
            });
        },
        async getAllProductsInfo(): Promise<{ products: IProductInfo[] }> {
            return new Promise(resolve =>
                setTimeout(
                    () =>
                        resolve({
                            products: [
                                {
                                    id: ProductIds.MONTHLY,
                                    displayName: 'Tonkeeper Pro Monthly',
                                    description: 'Access to premium features for one month',
                                    displayPrice: '$1.23',
                                    subscriptionGroup: 'emHJGjKGJKGGJim',
                                    subscriptionPeriod: 'month',
                                    environment: IosEnvironmentTypes.SANDBOX
                                }
                            ]
                        }),
                    3000
                )
            );
        },
        async getOriginalTransactionId(): Promise<IOriginalTransactionInfo> {
            return Promise.resolve({
                originalTransactionId: 2000000953417084,
                productId: ProductIds.MONTHLY,
                purchaseDate: new Date().toISOString(),
                environment: IosEnvironmentTypes.SANDBOX
            });
        },
        async manageSubscriptions(): Promise<void> {
            return new Promise(resolve => setTimeout(() => resolve(), 2000));
        }
    })
});

export class IosSubscriptionStrategy implements IIosSubscriptionStrategy {
    public source = SubscriptionSource.IOS as const;

    constructor(private sdk: IAppSdk) {}

    async subscribe(formData: ISubscriptionFormData): Promise<PurchaseStatuses> {
        const productId = formData.selectedPlan.id;

        if (!isProductId(productId)) {
            throw new Error('Missing product id for this product');
        }

        const subscription = await SubscriptionPlugin.subscribe({
            productId
        });

        if (subscription.status === PurchaseStatuses.CANCELED) {
            return PurchaseStatuses.CANCELED;
        }

        const originalTransactionId = subscription?.originalTransactionId;

        if (!originalTransactionId) {
            throw new Error('Failed to subscribe');
        }

        const savingResult = await saveIapPurchase(
            formData.tempToken,
            String(originalTransactionId)
        );

        if (!savingResult.ok) {
            throw new Error('Failed to subscribe');
        }

        return PurchaseStatuses.SUCCESS;
    }

    async getAllProductsInfo(): Promise<NormalizedProPlans> {
        try {
            const productIds = Object.values(ProductIds);
            const { products } = await SubscriptionPlugin.getAllProductsInfo({ productIds });

            const normalizedPlans: IDisplayPlan[] = products.map(plan => ({
                id: plan.id,
                displayName: plan.displayName,
                displayPrice: plan.displayPrice,
                subscriptionPeriod: plan?.subscriptionPeriod || 'month',
                formattedDisplayPrice: getFormattedProPrice(plan.displayPrice, false)
            }));

            return { plans: normalizedPlans, verifiedPromoCode: undefined };
        } catch (e) {
            console.error('Failed to fetch products info:', e);
            return { plans: undefined, verifiedPromoCode: undefined };
        }
    }

    async getCurrentSubscriptionInfo(): Promise<IIosPurchaseResult[]> {
        const res = await SubscriptionPlugin.getCurrentSubscriptionInfo();

        return res.subscriptions;
    }

    async getOriginalTransactionId(): Promise<IOriginalTransactionInfo> {
        return SubscriptionPlugin.getOriginalTransactionId();
    }

    async manageSubscriptions(): Promise<void> {
        return SubscriptionPlugin.manageSubscriptions();
    }

    async getSubscription(tempToken: string | null): Promise<ProSubscription> {
        const storage = this.sdk.storage;
        const authService = this.sdk.authService;

        const mainToken = await authService.getToken();

        const [currentSubscription, targetSubscription] = await Promise.all([
            getNormalizedSubscription(storage, mainToken),
            getNormalizedSubscription(storage, tempToken)
        ]);

        const bestSubscription = pickBestSubscription(currentSubscription, targetSubscription);

        const shouldPromoteToken =
            tempToken &&
            bestSubscription === targetSubscription &&
            isProSubscription(bestSubscription);

        if (shouldPromoteToken) {
            await authService.setToken(tempToken);
        }

        return bestSubscription;
    }
}
