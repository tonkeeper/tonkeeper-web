import { ProServiceTier } from '../tonConsoleApi';
import { Language } from './language';

export type ProSubscription = IosSubscription | CryptoSubscription | EmptySubscription;

export type IosSubscription =
    | IosActiveSubscription
    | IosRevokedSubscription
    | IosPromoSubscription
    | IosPendingSubscription;

export type CryptoSubscription =
    | CryptoActiveSubscription
    | CryptoTrialSubscription
    | CryptoFreeSubscription
    | CryptoPendingSubscription;

export type SubscriptionStrategy = ICryptoSubscriptionStrategy | IIosSubscriptionStrategy;

export type NormalizedProPlans =
    | { source: SubscriptionSources.IOS; plans: IProductInfo[] }
    | { source: SubscriptionSources.CRYPTO; plans: ProServiceTier[]; promoCode?: string };

export enum SubscriptionSources {
    IOS = 'ios',
    CRYPTO = 'crypto',
    EMPTY = 'empty'
}

interface BaseSubscription {
    source: SubscriptionSources;

    // Back compatability
    valid: boolean;
    isTrial: boolean;
    usedTrial: boolean;
    nextChargeDate?: Date;
}

interface BaseSubscriptionStrategy {
    source: SubscriptionSources;
}

// IOS Subscription Types
interface BaseIosSubscription extends BaseSubscription {
    source: SubscriptionSources.IOS;
    originalTransactionId: string | null;
    status: IosSubscriptionStatuses;
}

interface IosActiveSubscription extends BaseIosSubscription {
    status: IosSubscriptionStatuses.ACTIVE;

    // Back compatability
    valid: true;
    isTrial: false;
}

interface IosPendingSubscription extends BaseIosSubscription {
    status: IosSubscriptionStatuses.PENDING;
}

interface IosRevokedSubscription extends BaseIosSubscription {
    status: IosSubscriptionStatuses.REVOKED;
    reason: 'user_cancelled' | 'billing_error' | 'refund';
}

interface IosPromoSubscription extends BaseIosSubscription {
    status: IosSubscriptionStatuses.PROMO;
    valid: true;
    isTrial: true;
    usedTrial: true;
    trialEndDate: Date;
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
    originalTransactionId?: number;
}

export interface IOriginalTransactionInfo {
    originalTransactionId: number | string | null;
    productId?: ProductIds;
    purchaseDate?: string;
}

export interface IIosSubscriptionStrategy extends BaseSubscriptionStrategy {
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
    PAUSED = 'paused',
    REVOKED = 'revoked',
    EXPIRED = 'expired',
    PENDING = 'pending',
    PROMO = 'trial-mobile',
    IN_GRACE_PERIOD = 'inGracePeriod',
    IN_BILLING_RETRY_PERIOD = 'inBillingRetryPeriod',
    AUTO_RENEW_OFF = 'autoRenewOff',
    AUTO_RENEW_ON = 'autoRenewOn'
}

export enum ProductIds {
    MONTHLY = 'com.tonapps.tonkeeperpro.subscription.pro.monthly',
    YEARLY = 'com.tonapps.tonkeeperpro.subscription.pro.yearly'
}

export function isProductId(value: unknown): value is ProductIds {
    return typeof value === 'string' && Object.values(ProductIds).includes(value as ProductIds);
}

export function isIosStrategy(
    strategy?: SubscriptionStrategy
): strategy is IIosSubscriptionStrategy {
    return strategy?.source === SubscriptionSources.IOS;
}

// Crypto Subscription Types
interface BaseCryptoSubscription extends BaseSubscription {
    source: SubscriptionSources.CRYPTO;
    status: CryptoSubscriptionStatuses;
}

interface CryptoPendingSubscription extends BaseCryptoSubscription {
    status: CryptoSubscriptionStatuses.PENDING;
}

interface CryptoActiveSubscription extends BaseCryptoSubscription {
    status: CryptoSubscriptionStatuses.ACTIVE;
}

interface CryptoTrialSubscription extends BaseCryptoSubscription {
    status: CryptoSubscriptionStatuses.TRIAL;
    valid: true;
    isTrial: true;
    usedTrial: true;
    trialUserId: number;
    trialEndDate: Date;
}

interface CryptoFreeSubscription extends BaseCryptoSubscription {
    status: CryptoSubscriptionStatuses.FREE;
}

export interface ICryptoSubscriptionStrategy extends BaseSubscriptionStrategy {
    source: SubscriptionSources.CRYPTO;
    getAllProductsInfo(
        lang: Language | undefined,
        promoCode?: string
    ): Promise<[ProServiceTier[] | undefined, string | undefined]>;
}

export enum CryptoSubscriptionStatuses {
    FREE = 'free',
    ACTIVE = 'active',
    TRIAL = 'trial-tg',
    EXPIRED = 'expired',
    PENDING = 'pending'
}

export function isCryptoStrategy(
    strategy?: SubscriptionStrategy
): strategy is ICryptoSubscriptionStrategy {
    return strategy?.source === SubscriptionSources.CRYPTO;
}

// Empty Subscription Types
interface EmptySubscription extends BaseSubscription {
    source: SubscriptionSources.EMPTY;
    valid: false;
    isTrial: false;
    usedTrial: false;
}

export type ProState = ProStateAuthorized | ProStateNotAuthorized;

export interface ProStateWallet {
    publicKey: string;
    rawAddress: string;
}

export interface ProStateAuthorized {
    authorizedWallet: ProStateWallet;
    subscription: ProSubscription;
}

export interface ProStateNotAuthorized {
    authorizedWallet: null;
    subscription: ProSubscription;
}

export function isTrialSubscription(
    subscription: ProSubscription
): subscription is IosPromoSubscription | CryptoTrialSubscription {
    return (
        (subscription.source === SubscriptionSources.IOS &&
            subscription.status === IosSubscriptionStatuses.PROMO) ||
        (subscription.source === SubscriptionSources.CRYPTO &&
            subscription.status === CryptoSubscriptionStatuses.TRIAL)
    );
}

export function isValidSubscription(
    subscription: ProSubscription
): subscription is Exclude<ProSubscription, EmptySubscription> {
    return subscription.valid;
}

export function isPaidSubscription(
    subscription: ProSubscription
): subscription is IosActiveSubscription | CryptoActiveSubscription {
    return (
        (subscription.source === SubscriptionSources.IOS &&
            subscription.status === IosSubscriptionStatuses.ACTIVE) ||
        (subscription.source === SubscriptionSources.CRYPTO &&
            subscription.status === CryptoSubscriptionStatuses.ACTIVE)
    );
}

export interface IDisplayPlan {
    id: string;
    displayName: string;
    displayPrice: string;
}
