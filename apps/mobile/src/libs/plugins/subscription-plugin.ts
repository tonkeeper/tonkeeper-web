import { registerPlugin } from '@capacitor/core';
import {
    IosPurchaseStatuses,
    IosSubscriptionStatuses,
    ProductIds,
    SubscriptionSources
} from '@tonkeeper/core/dist/entries/pro';
import type {
    IProductInfo,
    IIosPurchaseResult,
    IOriginalTransactionInfo,
    IIosSubscriptionStrategy
} from '@tonkeeper/core/dist/entries/pro';

interface ISubscriptionPlugin {
    subscribe(options: { productId: ProductIds }): Promise<IIosPurchaseResult>;
    getProductInfo(options: { productId: ProductIds }): Promise<IProductInfo>;
    getAllProductsInfo(options: {
        productIds: ProductIds[];
    }): Promise<{ products: IProductInfo[] }>;
    getOriginalTransactionId(): Promise<IOriginalTransactionInfo>;
    manageSubscriptions(): Promise<void>;
}

const SubscriptionPlugin = registerPlugin<ISubscriptionPlugin>('Subscription', {
    web: () => ({
        async subscribe(): Promise<IIosPurchaseResult> {
            return new Promise<IIosPurchaseResult>(resolve => {
                setTimeout(() => {
                    resolve({
                        status: IosPurchaseStatuses.SUCCESS,
                        originalTransactionId: '2000000950005410'
                    });
                }, 3000);
            });
        },
        async getProductInfo(): Promise<IProductInfo> {
            return Promise.resolve({
                id: ProductIds.MONTHLY,
                displayName: '1 month',
                description: 'Access to premium features for one month',
                displayPrice: '$3.49',
                subscriptionGroup: 'emHJGjKGJKGGJim',
                subscriptionPeriod: '1 month',
                status: IosSubscriptionStatuses.ACTIVE
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
                                    displayName: '1 month',
                                    description: 'Access to premium features for one month',
                                    displayPrice: '$3.49',
                                    subscriptionGroup: 'emHJGjKGJKGGJim',
                                    subscriptionPeriod: '1 month'
                                },
                                {
                                    id: ProductIds.YEARLY,
                                    displayName: '1 year',
                                    description: 'Access to premium features for one year',
                                    displayPrice: '$34.99',
                                    subscriptionGroup: 'emHJGjKGJKGGJim',
                                    subscriptionPeriod: '1 year'
                                }
                            ]
                        }),
                    3000
                )
            );
        },
        async getOriginalTransactionId(): Promise<IOriginalTransactionInfo> {
            return Promise.resolve({
                originalTransactionId: '2000000950005410',
                productId: ProductIds.MONTHLY,
                purchaseDate: new Date().toISOString()
            });
        },
        async manageSubscriptions(): Promise<void> {
            return Promise.resolve();
        }
    })
});

class IosSubscriptionStrategy implements IIosSubscriptionStrategy {
    public source = SubscriptionSources.IOS as const;

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

    async getOriginalTransactionId(): Promise<IOriginalTransactionInfo> {
        return SubscriptionPlugin.getOriginalTransactionId();
    }

    async manageSubscriptions(): Promise<void> {
        return SubscriptionPlugin.manageSubscriptions();
    }
}

export const Subscription = new IosSubscriptionStrategy();
