import { registerPlugin } from '@capacitor/core';
import {
    IDisplayPlan,
    IIosPurchaseResult,
    IIosSubscriptionStrategy,
    ISubscriptionFormData,
    IOriginalTransactionInfo,
    IProductInfo,
    NormalizedProPlans,
    ISubscriptionConfig,
    isProductId
} from '@tonkeeper/core/dist/entries/pro';
import {
    IosEnvironmentTypes,
    PurchaseStatuses,
    IosSubscriptionStatuses,
    ProductIds
} from '@tonkeeper/core/dist/entries/pro';
import { SubscriptionSource } from '@tonkeeper/core/dist/pro';
import { getFormattedProPrice } from '@tonkeeper/core/dist/utils/pro';
import { ProAuthTokenType, saveIapPurchase } from '@tonkeeper/core/dist/service/proService';

interface ISubscriptionPlugin {
    subscribe(options: { productId: ProductIds }): Promise<IIosPurchaseResult>;
    getProductInfo(options: { productId: ProductIds }): Promise<IProductInfo>;
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
        async getProductInfo(): Promise<IProductInfo> {
            return Promise.resolve({
                id: ProductIds.MONTHLY,
                displayName: 'Tonkeeper Pro Monthly',
                description: 'Access to premium features for one month',
                displayPrice: '$1.23',
                subscriptionGroup: 'emHJGjKGJKGGJim',
                subscriptionPeriod: 'month',
                status: IosSubscriptionStatuses.ACTIVE,
                environment: IosEnvironmentTypes.SANDBOX
            });
        },
        async getCurrentSubscriptionInfo(): Promise<{ subscriptions: IIosPurchaseResult[] }> {
            return new Promise(resolve => {
                setTimeout(() => {
                    const now = new Date();
                    const expiration = new Date(now);
                    expiration.setMonth(now.getMonth() + 1);

                    resolve({
                        subscriptions: [
                            {
                                status: PurchaseStatuses.SUCCESS,
                                originalTransactionId: 2000000953417084,
                                environment: IosEnvironmentTypes.SANDBOX,
                                productId: ProductIds.MONTHLY,
                                purchaseDate: now.toISOString(),
                                expirationDate: expiration.toISOString(),
                                revocationDate: null,
                                isUpgraded: false
                            }
                        ]
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

class IosSubscriptionStrategy implements IIosSubscriptionStrategy {
    public source = SubscriptionSource.IOS as const;

    async subscribe(
        formData: ISubscriptionFormData,
        config: ISubscriptionConfig
    ): Promise<PurchaseStatuses> {
        const productId = formData.selectedPlan.id;
        const authService = config.authService;

        if (!authService) {
            throw new Error('Missing authService');
        }

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

        const savingResult = await authService.withTokenContext(ProAuthTokenType.TEMP, () =>
            saveIapPurchase(String(originalTransactionId))
        );

        if (!savingResult.ok) {
            throw new Error('Failed to subscribe');
        }

        return PurchaseStatuses.SUCCESS;
    }

    async getProductInfo(productId: ProductIds): Promise<IProductInfo> {
        return SubscriptionPlugin.getProductInfo({ productId });
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

    async hasActiveSubscription(): Promise<boolean> {
        const subscriptions = await this.getCurrentSubscriptionInfo();

        return subscriptions.length > 0;
    }

    async getOriginalTransactionId(): Promise<IOriginalTransactionInfo> {
        return SubscriptionPlugin.getOriginalTransactionId();
    }

    async manageSubscriptions(): Promise<void> {
        return SubscriptionPlugin.manageSubscriptions();
    }
}

export const Subscription = new IosSubscriptionStrategy();
