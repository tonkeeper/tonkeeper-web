import { CryptoCurrency, SubscriptionSource } from '../pro';
import { ProServiceTier } from '../tonConsoleApi';
import { Language } from './language';

export type ProSubscription = IosSubscription | CryptoSubscription | TelegramSubscription | null;

export type IosSubscription =
    | IosActiveSubscription
    | IosExpiredSubscription
    | IosPendingSubscription;

export type CryptoSubscription =
    | CryptoActiveSubscription
    | CryptoExpiredSubscription
    | CryptoPendingSubscription;

export type TelegramSubscription = TelegramActiveSubscription | TelegramExpiredSubscription;

export type SubscriptionStrategy = ICryptoSubscriptionStrategy | IIosSubscriptionStrategy;

export type NormalizedProPlans =
    | { source: SubscriptionSource.IOS; plans: IProductInfo[] }
    | { source: SubscriptionSource.CRYPTO; plans: ProServiceTier[]; promoCode?: string };

interface BaseSubscription {
    source: SubscriptionSource;
    valid: boolean;
    isTrial: boolean;
    usedTrial: boolean;
    nextChargeDate?: Date;
}

interface BaseSubscriptionStrategy {
    source: SubscriptionSource;
}

// IOS Subscription Types
interface IosDBStoredInfo {
    txId?: string;
    price?: number;
    currency?: string;
    expiresDate?: Date;
    purchaseDate?: Date;
    productId?: string;
    storeFront?: string;
    storeFrontId?: string;
    transactionType?: string;
    originalTransactionId?: string;
}

interface BaseIosSubscription extends BaseSubscription {
    source: SubscriptionSource.IOS;
    status: IosSubscriptionStatuses;
    isTrial: false;
}

interface IosActiveSubscription extends BaseIosSubscription, IosDBStoredInfo {
    status: IosSubscriptionStatuses.ACTIVE;
    valid: true;
}

interface IosExpiredSubscription extends BaseIosSubscription, IosDBStoredInfo {
    status: IosSubscriptionStatuses.EXPIRED;
}

export interface IosPendingSubscription extends BaseIosSubscription {
    status: IosSubscriptionStatuses.PENDING;
    originalTransactionId?: number | null;
    valid: false;
    displayName?: string;
    displayPrice?: string;
}

export interface IProductInfo {
    id: ProductIds;
    displayName: string;
    description: string;
    displayPrice: string;
    subscriptionGroup: string;
    subscriptionPeriod: string;
    environment: IosEnvironmentTypes;
}

export interface IIosPurchaseResult {
    status: IosPurchaseStatuses;
    productId: ProductIds;
    isUpgraded: boolean;
    purchaseDate: string;
    expirationDate: string;
    revocationDate: string | null;
    originalTransactionId?: number;
    environment: IosEnvironmentTypes;
}

export interface IOriginalTransactionInfo {
    originalTransactionId: number | string | null;
    productId?: ProductIds;
    purchaseDate?: string;
    environment: IosEnvironmentTypes;
}

export interface IIosSubscriptionStrategy extends BaseSubscriptionStrategy {
    source: SubscriptionSource.IOS;
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

export enum IosEnvironmentTypes {
    SANDBOX = 'Sandbox',
    PRODUCTION = 'Production'
}

export function isProductId(value: unknown): value is ProductIds {
    return typeof value === 'string' && Object.values(ProductIds).includes(value as ProductIds);
}

export function isIosStrategy(
    strategy?: SubscriptionStrategy
): strategy is IIosSubscriptionStrategy {
    return strategy?.source === SubscriptionSource.IOS;
}

// Crypto Subscription Types
interface CryptoDBStoredInfo {
    amount?: string;
    currency?: CryptoCurrency;
    purchaseDate?: Date;
}

interface BaseCryptoSubscription extends BaseSubscription {
    source: SubscriptionSource.CRYPTO;
    status: CryptoSubscriptionStatuses;
    isTrial: false;
}

interface CryptoActiveSubscription extends BaseCryptoSubscription, CryptoDBStoredInfo {
    status: CryptoSubscriptionStatuses.ACTIVE;
    valid: true;
}

interface CryptoExpiredSubscription extends BaseCryptoSubscription, CryptoDBStoredInfo {
    status: CryptoSubscriptionStatuses.EXPIRED;
    valid: false;
}

export interface CryptoPendingSubscription extends BaseCryptoSubscription {
    status: CryptoSubscriptionStatuses.PENDING;
    valid: false;
    displayName?: string;
    displayPrice?: string;
}

export interface ICryptoSubscriptionStrategy extends BaseSubscriptionStrategy {
    source: SubscriptionSource.CRYPTO;
    getAllProductsInfo(
        lang: Language | undefined,
        promoCode?: string
    ): Promise<[ProServiceTier[] | undefined, string | undefined]>;
}

export enum CryptoSubscriptionStatuses {
    ACTIVE = 'active',
    EXPIRED = 'expired',
    PENDING = 'pending'
}

export function isCryptoStrategy(
    strategy?: SubscriptionStrategy
): strategy is ICryptoSubscriptionStrategy {
    return strategy?.source === SubscriptionSource.CRYPTO;
}

// Telegram Subscription Types
interface BaseTelegramSubscription extends BaseSubscription {
    source: SubscriptionSource.TELEGRAM;
    status: TelegramSubscriptionStatuses;
    isTrial: true;
    usedTrial: true;
    trialUserId?: number;
    trialEndDate?: Date;
}

interface TelegramActiveSubscription extends BaseTelegramSubscription {
    status: TelegramSubscriptionStatuses.ACTIVE;
    valid: true;
}

interface TelegramExpiredSubscription extends BaseTelegramSubscription {
    status: TelegramSubscriptionStatuses.EXPIRED;
    valid: false;
}

export enum TelegramSubscriptionStatuses {
    ACTIVE = 'active',
    EXPIRED = 'expired'
}

export function isTelegramSubscription(
    subscription: ProSubscription
): subscription is TelegramSubscription {
    return subscription?.source === SubscriptionSource.TELEGRAM;
}

export function isTelegramActiveSubscription(
    subscription: ProSubscription
): subscription is TelegramSubscription {
    return (
        subscription?.source === SubscriptionSource.TELEGRAM &&
        subscription?.status === TelegramSubscriptionStatuses.ACTIVE
    );
}

// Pro State
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

export function isPendingSubscription(
    subscription: ProSubscription
): subscription is
    | (IosSubscription & { status: IosSubscriptionStatuses.PENDING })
    | (CryptoSubscription & { status: CryptoSubscriptionStatuses.PENDING }) {
    return (
        (subscription?.source === SubscriptionSource.IOS &&
            subscription.status === IosSubscriptionStatuses.PENDING) ||
        (subscription?.source === SubscriptionSource.CRYPTO &&
            subscription.status === CryptoSubscriptionStatuses.PENDING)
    );
}

export function isValidSubscription(
    subscription: ProSubscription | undefined
): subscription is Exclude<ProSubscription, null | undefined> {
    return !!subscription && hasSubscriptionSource(subscription) && subscription.valid;
}

export function isPaidSubscription(
    subscription: ProSubscription
): subscription is IosActiveSubscription | CryptoActiveSubscription {
    return (
        (subscription?.source === SubscriptionSource.IOS &&
            subscription.status === IosSubscriptionStatuses.ACTIVE) ||
        (subscription?.source === SubscriptionSource.CRYPTO &&
            subscription.status === CryptoSubscriptionStatuses.ACTIVE)
    );
}

export function isProSubscription(value: unknown): value is ProSubscription {
    return typeof value === 'object' && value !== null && 'source' in value;
}

export function hasSubscriptionSource(
    subscription: ProSubscription
): subscription is Exclude<ProSubscription, null> {
    return (
        subscription?.source === SubscriptionSource.IOS ||
        subscription?.source === SubscriptionSource.CRYPTO ||
        subscription?.source === SubscriptionSource.TELEGRAM
    );
}

export function hasUsedTrial(
    subscription: ProSubscription
): subscription is Exclude<ProSubscription, null> & { usedTrial: true } {
    return subscription !== null && subscription.usedTrial;
}

export function isCryptoProPlans(
    data: NormalizedProPlans | undefined
): data is Extract<
    NormalizedProPlans,
    { source: SubscriptionSource.CRYPTO; plans: ProServiceTier[] }
> {
    return (
        data?.source === SubscriptionSource.CRYPTO &&
        Array.isArray(data.plans) &&
        data.plans.length > 0
    );
}

export interface IDisplayPlan {
    id: string;
    displayName: string;
    displayPrice: string;
    formattedDisplayPrice: string;
}
