import { registerPlugin } from '@capacitor/core';
import type {
    IIosPurchaseResult,
    IIosSubscriptionStrategy,
    IOriginalTransactionInfo,
    IProductInfo
} from '@tonkeeper/core/dist/entries/pro';
import {
    IosEnvironmentTypes,
    IosPurchaseStatuses,
    IosSubscriptionStatuses,
    ProductIds
} from '@tonkeeper/core/dist/entries/pro';
import { SubscriptionSource } from '@tonkeeper/core/dist/pro';

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
                        status: IosPurchaseStatuses.SUCCESS,
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
                                status: IosPurchaseStatuses.SUCCESS,
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
                                },
                                {
                                    id: ProductIds.YEARLY,
                                    displayName: 'Tonkeeper Pro Yearly',
                                    description: 'Access to premium features for one year',
                                    displayPrice: '$11.45',
                                    subscriptionGroup: 'emHJGjKGJKGGJim',
                                    subscriptionPeriod: 'year',
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

    async subscribe(productId: ProductIds): Promise<IIosPurchaseResult> {
        return SubscriptionPlugin.subscribe({ productId });
    }

    async getProductInfo(productId: ProductIds): Promise<IProductInfo> {
        return SubscriptionPlugin.getProductInfo({ productId });
    }

    async getAllProductsInfo(): Promise<IProductInfo[]> {
        try {
            const productIds = Object.values(ProductIds);
            const result = await SubscriptionPlugin.getAllProductsInfo({ productIds });

            return result.products;
        } catch (e) {
            console.error('Failed to fetch products info:', e);
            return [];
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
