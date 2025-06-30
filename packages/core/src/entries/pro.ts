// export type ProSubscription = IosSubscription | CryptoSubscription | EmptySubscription;

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

interface BaseSubscriptionStrategy {
    source: SubscriptionSources;
}

// IOS Subscription Types
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

export interface ICryptoSubscriptionStrategy extends BaseSubscriptionStrategy {
    source: SubscriptionSources.CRYPTO;
    getAllProductsInfo(
        lang: Language | undefined,
        promoCode?: string
    ): Promise<[ProServiceTier[] | undefined, string | undefined]>;
}

export enum CryptoSubscriptionStatuses {
    FREE = 'free',
    TRIAL = 'trial',
    ACTIVE = 'active',
    EXPIRED = 'expired'
}

export function isCryptoStrategy(
    strategy?: SubscriptionStrategy
): strategy is ICryptoSubscriptionStrategy {
    return strategy?.source === SubscriptionSources.CRYPTO;
}

export interface IDisplayPlan {
    id: string;
    displayName: string;
    displayPrice: string;
}

// TODO REMOVE BELOW
export interface ProStateAuthorized {
    authorizedWallet: ProStateWallet;
    subscription: ProSubscription;
}

export interface ProStateNotAuthorized {
    authorizedWallet: null;
    subscription: ProSubscription;
}

export type ProState = ProStateAuthorized | ProStateNotAuthorized;

export interface ProStateWallet {
    publicKey: string;
    rawAddress: string;
}

export type ProSubscription = ProSubscriptionValid | ProSubscriptionInvalid | any;

export interface ProSubscriptionPaid {
    valid: true;
    isTrial: false;
    usedTrial: boolean;
    nextChargeDate: Date;
}

export interface ProSubscriptionTrialMobilePromo {
    type: 'trial-mobile';
    valid: true;
    isTrial: true;
    trialEndDate: Date;
    usedTrial: true;
}

export interface ProSubscriptionTrialTg {
    type: 'trial-tg';
    trialUserId: number;
    valid: true;
    isTrial: true;
    trialEndDate: Date;
    usedTrial: true;
}

export type ProSubscriptionTrial = ProSubscriptionTrialTg | ProSubscriptionTrialMobilePromo;

export type ProSubscriptionValid = ProSubscriptionPaid | ProSubscriptionTrial;

export interface ProSubscriptionInvalid {
    valid: false;
    isTrial: false;
    usedTrial: boolean;
}

export function isTrialSubscription(
    subscription: ProSubscription
): subscription is ProSubscriptionTrial {
    return subscription.isTrial && subscription.valid;
}

export function isValidSubscription(
    subscription: ProSubscription
): subscription is ProSubscriptionValid {
    return subscription.valid;
}

export function isPaidSubscription(
    subscription: ProSubscription
): subscription is ProSubscriptionPaid {
    return subscription.valid && !subscription.isTrial;
}
