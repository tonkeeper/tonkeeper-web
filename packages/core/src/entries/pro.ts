import { CryptoCurrency, SubscriptionSource } from '../pro';
import { Language } from './language';
import { IAppSdk } from '../AppSdk';
import { APIConfig } from './apis';
import { AccountsStorage } from '../service/accountsStorage';
import { TonWalletStandard } from './wallet';
import { InvoicesInvoice } from '../tonConsoleApi';
import { RecipientData } from './send';
import { AssetAmount } from './crypto/asset/asset-amount';
import { ProAuthTokenService } from '../service/proService';

export type ProSubscription = IosSubscription | CryptoSubscription | TelegramSubscription | null;

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
}

export type NormalizedProPlans = {
    plans: IDisplayPlan[] | undefined;
    verifiedPromoCode: string | undefined;
};

interface BaseSubscription {
    source: SubscriptionSource;
    valid: boolean;
    nextChargeDate?: Date;
    auth: WalletAuth | TelegramAuth;
}

export interface ConfirmState {
    invoice: InvoicesInvoice;
    recipient: RecipientData;
    assetAmount: AssetAmount;
    wallet: TonWalletStandard;
}

export interface ISubscriptionFormData {
    selectedPlan: IDisplayPlan;
    promoCode?: string;
}

export interface ISubscriptionConfig {
    ws?: AccountsStorage;
    sdk?: IAppSdk;
    api?: APIConfig;
    authService?: ProAuthTokenService;
    onConfirm?: (success?: boolean) => Promise<void>;
    onOpen?: (p?: {
        confirmState: ConfirmState | null;
        onConfirm?: (success?: boolean) => void;
    }) => void;
    targetAuth?: WalletAuth | null;
}

interface BaseSubscriptionStrategy {
    source: SubscriptionSource;
    subscribe(
        formData: ISubscriptionFormData,
        config: ISubscriptionConfig
    ): Promise<PurchaseStatuses>;
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
    status: PurchaseStatuses;
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
    getProductInfo(productId: ProductIds): Promise<IProductInfo>;
    manageSubscriptions(): Promise<void>;
    getOriginalTransactionId(): Promise<IOriginalTransactionInfo>;
    getCurrentSubscriptionInfo(): Promise<IIosPurchaseResult[]>;
    hasActiveSubscription(): Promise<boolean>;
}

export enum PurchaseStatuses {
    SUCCESS = 'success',
    PENDING = 'pending',
    CANCELED = 'cancelled'
}

export enum IosSubscriptionStatuses {
    ACTIVE = 'active',
    EXPIRED = 'expired'
}

export enum ProductIds {
    MONTHLY = 'com.tonapps.tonkeeperpro.subscription.pro.monthly'
}

export enum IosEnvironmentTypes {
    SANDBOX = 'Sandbox'
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
    promoCode?: string;
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
    displayName?: string;
    displayPrice?: string;
    promoCode?: string;
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

export function isPaidActiveSubscription(
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
    return (
        isPaidActiveSubscription(value) &&
        isIosSubscription(value) &&
        value?.autoRenewStatus === true
    );
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

export function hasWalletAuth(value?: unknown): value is { auth: WalletAuth } {
    return (
        isProSubscription(value) &&
        'auth' in value &&
        value.auth?.type === AuthTypes.WALLET &&
        'wallet' in value.auth
    );
}

export interface IDisplayPlan {
    id: string;
    displayName: string;
    displayPrice: string;
    subscriptionPeriod?: string;
    formattedDisplayPrice: string;
}
