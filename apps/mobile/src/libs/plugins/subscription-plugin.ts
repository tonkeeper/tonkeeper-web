import { registerPlugin } from '@capacitor/core';
import { ProductIds, SubscriptionSources } from '@tonkeeper/core/dist/entries/pro';
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

const SubscriptionPlugin = registerPlugin<ISubscriptionPlugin>('Subscription');

class IosSubscriptionStrategy implements IIosSubscriptionStrategy {
    public source = SubscriptionSources.IOS as const;

    async subscribe(productId: ProductIds): Promise<IIosPurchaseResult> {
        return SubscriptionPlugin.subscribe({ productId });
    }

    async getProductInfo(productId: ProductIds): Promise<IProductInfo> {
        return SubscriptionPlugin.getProductInfo({ productId });
    }

    async getAllProductsInfo(): Promise<IProductInfo[]> {
        const productIds = Object.values(ProductIds);
        const result = await SubscriptionPlugin.getAllProductsInfo({ productIds });

        return result.products;
    }

    async getOriginalTransactionId(): Promise<IOriginalTransactionInfo> {
        return SubscriptionPlugin.getOriginalTransactionId();
    }

    async manageSubscriptions(): Promise<void> {
        return SubscriptionPlugin.manageSubscriptions();
    }
}

export const Subscription = new IosSubscriptionStrategy();
