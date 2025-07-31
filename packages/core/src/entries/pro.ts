import { CryptoCurrency, SubscriptionSource } from '../pro';
import { Language } from './language';

export type ProSubscription = IosSubscription | CryptoSubscription | TelegramSubscription | null;

export interface ConstructedSubscription extends Partial<BaseSubscription> {
    auth: WalletAuth | TelegramAuth;
}

export type IosSubscription = IosActiveSubscription | IosExpiredSubscription;

export type CryptoSubscription =
    | CryptoActiveSubscription
    | CryptoExpiredSubscription
    | CryptoPendingSubscription;

export type TelegramSubscription = TelegramActiveSubscription | TelegramExpiredSubscription;

export type SubscriptionStrategy = ICryptoSubscriptionStrategy | IIosSubscriptionStrategy;

export enum AuthTypes {
    WALLET = 'wallet',
    TELEGRAM = 'telegram'
}

export interface WalletAuth {
    type: AuthTypes.WALLET;
    wallet: ProStateWallet;
}

export interface TelegramAuth {
    type: AuthTypes.TELEGRAM;
    trialUserId: number | undefined;
}

export type NormalizedProPlans = {
    plans: IDisplayPlan[] | undefined;
    verifiedPromoCode: string | undefined;
};

interface BaseSubscription {
    source: SubscriptionSource;
    valid: boolean;
    usedTrial: boolean;
    nextChargeDate?: Date;
    auth: WalletAuth | TelegramAuth;
}

interface BaseSubscriptionStrategy {
    source: SubscriptionSource;

    getAllProductsInfo(lang?: Language, promoCode?: string): Promise<NormalizedProPlans>;
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
    autoRenewStatus?: boolean;
}

interface BaseIosSubscription extends BaseSubscription, IosDBStoredInfo {
    source: SubscriptionSource.IOS;
    status: IosSubscriptionStatuses;
    auth: WalletAuth;
}

interface IosActiveSubscription extends BaseIosSubscription {
    status: IosSubscriptionStatuses.ACTIVE;
    valid: true;
    autoRenewStatus: boolean;
}

interface IosExpiredSubscription extends BaseIosSubscription {
    status: IosSubscriptionStatuses.EXPIRED;
    valid: false;
    autoRenewStatus: false;
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
    manageSubscriptions(): Promise<void>;
    getOriginalTransactionId(): Promise<IOriginalTransactionInfo>;
    getCurrentSubscriptionInfo(): Promise<IIosPurchaseResult[]>;
    hasActiveSubscription(): Promise<boolean>;
}

export enum IosPurchaseStatuses {
    SUCCESS = 'success',
    PENDING = 'pending',
    CANCELED = 'cancelled'
}

export enum IosSubscriptionStatuses {
    ACTIVE = 'active',
    EXPIRED = 'expired'
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
    expiresDate?: Date;
    purchaseDate?: Date;
}

interface BaseCryptoSubscription extends BaseSubscription {
    source: SubscriptionSource.CRYPTO;
    status: CryptoSubscriptionStatuses;
    auth: WalletAuth;
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
interface TelegramDBStoredInfo {
    expiresDate?: Date;
}

interface BaseTelegramSubscription extends BaseSubscription, TelegramDBStoredInfo {
    source: SubscriptionSource.TELEGRAM;
    status: TelegramSubscriptionStatuses;
    usedTrial: true;
    auth: TelegramAuth;
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

// Pro State
export type ProState = {
    current: ProSubscription;
    target: ProSubscription | ConstructedSubscription;
};

export interface ProStateWallet {
    publicKey: string;
    rawAddress: string;
}

export function isPendingSubscription(
    subscription: unknown
): subscription is CryptoSubscription & { status: CryptoSubscriptionStatuses.PENDING } {
    return (
        isProSubscription(subscription) &&
        subscription?.source === SubscriptionSource.CRYPTO &&
        subscription.status === CryptoSubscriptionStatuses.PENDING
    );
}

export function isValidSubscription(
    subscription: ProSubscription | undefined
): subscription is Exclude<ProSubscription, null | undefined> {
    return !!subscription && hasSubscriptionSource(subscription) && subscription.valid;
}

export function isExpiredSubscription(
    subscription: unknown
): subscription is
    | IosExpiredSubscription
    | CryptoExpiredSubscription
    | TelegramExpiredSubscription {
    return (
        isProSubscription(subscription) &&
        ((subscription?.source === SubscriptionSource.IOS &&
            subscription.status === IosSubscriptionStatuses.EXPIRED) ||
            (subscription?.source === SubscriptionSource.CRYPTO &&
                subscription.status === CryptoSubscriptionStatuses.EXPIRED) ||
            (subscription?.source === SubscriptionSource.TELEGRAM &&
                subscription.status === TelegramSubscriptionStatuses.EXPIRED))
    );
}

export function isPaidSubscription(
    value: unknown
): value is IosActiveSubscription | CryptoActiveSubscription {
    return (
        isProSubscription(value) &&
        ((value?.source === SubscriptionSource.IOS &&
            value.status === IosSubscriptionStatuses.ACTIVE) ||
            (value?.source === SubscriptionSource.CRYPTO &&
                value.status === CryptoSubscriptionStatuses.ACTIVE))
    );
}

export function isProSubscription(value: unknown): value is Exclude<ProSubscription, null> {
    return typeof value === 'object' && value !== null && 'source' in value && 'status' in value;
}

export function isCryptoSubscription(value: unknown): value is CryptoSubscription {
    return isProSubscription(value) && value?.source === SubscriptionSource.CRYPTO;
}

export function isIosSubscription(value: unknown): value is IosSubscription {
    return isProSubscription(value) && value?.source === SubscriptionSource.IOS;
}

export function isIosAutoRenewableSubscription(value: unknown): value is IosActiveSubscription & {
    autoRenewStatus: true;
} {
    return isPaidSubscription(value) && isIosSubscription(value) && value?.autoRenewStatus === true;
}

export function isIosExpiredSubscription(value: unknown): value is IosExpiredSubscription {
    return isIosSubscription(value) && value.status === IosSubscriptionStatuses.EXPIRED;
}

export function isIosCanceledSubscription(
    value: unknown
): value is IosActiveSubscription & { autoRenewStatus: false } {
    return (
        isIosSubscription(value) &&
        value.status === IosSubscriptionStatuses.ACTIVE &&
        !value.autoRenewStatus
    );
}

export function isTelegramSubscription(value: unknown): value is TelegramSubscription {
    return isProSubscription(value) && value?.source === SubscriptionSource.TELEGRAM;
}

export function isTelegramActiveSubscription(value: unknown): value is TelegramActiveSubscription {
    return (
        isTelegramSubscription(value) &&
        value?.source === SubscriptionSource.TELEGRAM &&
        value?.status === TelegramSubscriptionStatuses.ACTIVE
    );
}

export function hasAuth(
    subscription: ProSubscription | ConstructedSubscription | null | undefined
): subscription is Exclude<ProSubscription | ConstructedSubscription, null> & {
    auth: WalletAuth | TelegramAuth;
} {
    return !!subscription?.auth;
}

export function hasIosPrice(
    subscription: IosSubscription
): subscription is IosActiveSubscription | IosExpiredSubscription {
    return (
        subscription.status === IosSubscriptionStatuses.ACTIVE ||
        subscription.status === IosSubscriptionStatuses.EXPIRED
    );
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

export function hasWalletAuth(
    subscription: ProState['target'] | null | undefined
): subscription is { auth: WalletAuth } {
    return (
        subscription !== null &&
        typeof subscription === 'object' &&
        'auth' in subscription &&
        subscription.auth?.type === AuthTypes.WALLET &&
        'wallet' in subscription.auth
    );
}

export interface IDisplayPlan {
    id: string;
    displayName: string;
    displayPrice: string;
    subscriptionPeriod?: string;
    formattedDisplayPrice: string;
}
