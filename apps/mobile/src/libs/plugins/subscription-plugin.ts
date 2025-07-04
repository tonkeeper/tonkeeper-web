import { registerPlugin } from '@capacitor/core';
import {
    IosEnvironmentTypes,
    IosPurchaseStatuses,
    IosSubscriptionStatuses,
    ProductIds
} from '@tonkeeper/core/dist/entries/pro';
import type {
    IProductInfo,
    IIosPurchaseResult,
    IOriginalTransactionInfo,
    IIosSubscriptionStrategy
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
}

const SubscriptionPlugin = registerPlugin<ISubscriptionPlugin>('Subscription', {
    web: () => ({
        async subscribe(): Promise<IIosPurchaseResult> {
            return new Promise<IIosPurchaseResult>(resolve => {
                setTimeout(() => {
                    resolve({
                        status: IosPurchaseStatuses.SUCCESS,
                        originalTransactionId: 2000000950005410,
                        environment: IosEnvironmentTypes.SANDBOX
                    });
                }, 3000);
            });
        },
        async getProductInfo(): Promise<IProductInfo> {
            return Promise.resolve({
                id: ProductIds.MONTHLY,
                displayName: 'Tonkeeper Pro Monthly',
                description: 'Access to premium features for one month',
                displayPrice: '$3.49',
                subscriptionGroup: 'emHJGjKGJKGGJim',
                subscriptionPeriod: 'month',
                status: IosSubscriptionStatuses.ACTIVE,
                environment: IosEnvironmentTypes.SANDBOX
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
                                    displayPrice: '$3.49',
                                    subscriptionGroup: 'emHJGjKGJKGGJim',
                                    subscriptionPeriod: 'month',
                                    environment: IosEnvironmentTypes.SANDBOX
                                },
                                {
                                    id: ProductIds.YEARLY,
                                    displayName: 'Tonkeeper Pro Yearly',
                                    description: 'Access to premium features for one year',
                                    displayPrice: '$34.99',
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
                originalTransactionId: '2000000950005410',
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

    async getOriginalTransactionId(): Promise<IOriginalTransactionInfo> {
        return SubscriptionPlugin.getOriginalTransactionId();
    }

    async manageSubscriptions(): Promise<void> {
        return SubscriptionPlugin.manageSubscriptions();
    }
}

export const Subscription = new IosSubscriptionStrategy();
