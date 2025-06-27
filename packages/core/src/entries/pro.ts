export type ProSubscription = IosSubscription | CryptoSubscription | EmptySubscription;

export type IosSubscription = IosActiveSubscription | IosRevokedSubscription;

export type CryptoSubscription =
    | CryptoActiveSubscription
    | CryptoTrialSubscription
    | CryptoFreeSubscription;

export type SubscriptionStrategy = ICryptoSubscriptionStrategy | IIosSubscriptionStrategy;

export enum SubscriptionSources {
    IOS = 'ios',
    CRYPTO = 'crypto',
    EMPTY = 'empty'
}

interface BaseSubscription {
    source: SubscriptionSources;
    expiresAt: number;
    isActive: boolean;
}

// IOS Subscription Types
export function isIosSubscription(subscription: any): subscription is IosSubscription {
    return subscription.source === SubscriptionSources.IOS;
}

interface BaseIosSubscription extends BaseSubscription {
    source: SubscriptionSources.IOS;
    originalTransactionId: string;
    status: IosSubscriptionStatuses;
}

interface IosActiveSubscription extends BaseIosSubscription {
    status: IosSubscriptionStatuses.ACTIVE;
}

interface IosRevokedSubscription extends BaseIosSubscription {
    status: IosSubscriptionStatuses.REVOKED;
    reason: 'user_cancelled' | 'billing_error' | 'refund';
}

export interface IProductInfo {
    id: ProductIds;
    displayName: string;
    description: string;
    displayPrice: string;
    subscriptionGroup: string;
    subscriptionPeriod: string;
}

export interface IIosPurchaseResult {
    status: IosPurchaseStatuses;
    originalTransactionId?: string;
}

export interface IOriginalTransactionInfo {
    originalTransactionId: string | null;
    productId?: ProductIds;
    purchaseDate?: string;
}

export interface IIosSubscriptionStrategy {
    source: SubscriptionSources.IOS;
    subscribe(productId: ProductIds): Promise<IIosPurchaseResult>;
    getProductInfo(productId: ProductIds): Promise<IProductInfo>;
    getAllProductsInfo(): Promise<IProductInfo[]>;
    manageSubscriptions(): Promise<void>;
    getOriginalTransactionId(): Promise<IOriginalTransactionInfo>;
}

export enum IosPurchaseStatuses {
    SUCCESS = 'success',
    PENDING = 'pending',
    CANCELED = 'cancelled'
}

export enum IosSubscriptionStatuses {
    ACTIVE = 'active',
    REVOKED = 'revoked',
    EXPIRED = 'expired',
    IN_GRACE_PERIOD = 'inGracePeriod',
    IN_BILLING_RETRY_PERIOD = 'inBillingRetryPeriod',
    PAUSED = 'paused',
    AUTO_RENEW_OFF = 'autoRenewOff',
    AUTO_RENEW_ON = 'autoRenewOn'
}

export enum ProductIds {
    MONTHLY = 'com.tonapps.tonkeeperpro.pro.monthly',
    YEARLY = 'com.tonapps.tonkeeperpro.pro.yearly'
}

// Crypto Subscription Types
interface BaseCryptoSubscription extends BaseSubscription {
    source: SubscriptionSources.CRYPTO;
    txHash: string;
    status: CryptoSubscriptionStatuses;
}

interface CryptoActiveSubscription extends BaseCryptoSubscription {
    status: CryptoSubscriptionStatuses.ACTIVE;
}

interface CryptoTrialSubscription extends BaseCryptoSubscription {
    status: CryptoSubscriptionStatuses.TRIAL;
    usedTrial: boolean;
}

interface CryptoFreeSubscription extends BaseCryptoSubscription {
    status: CryptoSubscriptionStatuses.FREE;
}

// Empty Subscription Types
interface EmptySubscription extends Omit<BaseSubscription, 'expiresAt'> {
    source: SubscriptionSources.EMPTY;
}

export interface ICryptoSubscriptionStrategy {
    source: SubscriptionSources.CRYPTO;
    subscribe(productId: ProductIds): Promise<IIosPurchaseResult>;
    getProductInfo(productId: string): Promise<IProductInfo>;
    getAllProductsInfo(): Promise<IProductInfo[]>;
    manageSubscriptions(): Promise<void>;
    getOriginalTransactionId(): Promise<IOriginalTransactionInfo>;
}

export enum CryptoSubscriptionStatuses {
    FREE = 'free',
    TRIAL = 'trial',
    ACTIVE = 'active',
    EXPIRED = 'expired'
}
