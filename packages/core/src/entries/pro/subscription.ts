import {
    CryptoSubscriptionStatuses,
    IosSubscriptionStatuses,
    ProductIds,
    PurchaseStatuses,
    TelegramSubscriptionStatuses
} from './enums';
import {
    IIosPurchaseResult,
    IOriginalTransactionInfo,
    ISubscriptionConfig,
    ISubscriptionFormData,
    NormalizedProPlans,
    TelegramAuth,
    WalletAuth
} from './common';
import { Language } from '../language';
import { CryptoCurrency, SubscriptionSource } from '../../pro';

export type ProSubscription = IosSubscription | CryptoSubscription | TelegramSubscription | null;

export type IosSubscription = IosActiveSubscription | IosExpiredSubscription;

export type CryptoSubscription =
    | CryptoActiveSubscription
    | CryptoExpiredSubscription
    | CryptoPendingSubscription;

export type TelegramSubscription = TelegramActiveSubscription | TelegramExpiredSubscription;

export type SubscriptionStrategy = ICryptoSubscriptionStrategy | IIosSubscriptionStrategy;

export interface BaseSubscription {
    source: SubscriptionSource;
    valid: boolean;
    nextChargeDate?: Date;
    auth: WalletAuth | TelegramAuth;
}

export interface BaseSubscriptionStrategy {
    source: SubscriptionSource;
    subscribe(
        formData: ISubscriptionFormData,
        config: ISubscriptionConfig
    ): Promise<PurchaseStatuses>;
    getSubscription(): Promise<ProSubscription>;
    getAllProductsInfo(lang?: Language, promoCode?: string): Promise<NormalizedProPlans>;
}

// IOS Subscription Types
export interface IosDBStoredInfo {
    txId: string;
    price: number;
    currency: string;
    expiresDate: Date;
    purchaseDate: Date;
    productId: ProductIds;
    storeFront: string;
    storeFrontId: string;
    transactionType: string;
    originalTransactionId: string;
    autoRenewStatus: boolean;
    priceMultiplier: number;
}

export interface BaseIosSubscription extends BaseSubscription, IosDBStoredInfo {
    source: SubscriptionSource.IOS;
    status: IosSubscriptionStatuses;
    auth: WalletAuth;
}

export interface IosActiveSubscription extends BaseIosSubscription {
    status: IosSubscriptionStatuses.ACTIVE;
    valid: true;
    autoRenewStatus: boolean;
}

export interface IosExpiredSubscription extends BaseIosSubscription {
    status: IosSubscriptionStatuses.EXPIRED;
    valid: false;
    autoRenewStatus: false;
}

export interface IIosSubscriptionStrategy extends BaseSubscriptionStrategy {
    source: SubscriptionSource.IOS;
    manageSubscriptions(): Promise<void>;
    getOriginalTransactionId(): Promise<IOriginalTransactionInfo>;
    getCurrentSubscriptionInfo(): Promise<IIosPurchaseResult[]>;
}

// Crypto Subscription Types
export interface CryptoDBStoredInfo {
    amount: string;
    currency: CryptoCurrency;
    expiresDate: Date;
    purchaseDate: Date;
    promoCode?: string;
}

export interface BaseCryptoSubscription extends BaseSubscription {
    source: SubscriptionSource.CRYPTO;
    status: CryptoSubscriptionStatuses;
    auth: WalletAuth;
}

export interface CryptoActiveSubscription extends BaseCryptoSubscription, CryptoDBStoredInfo {
    status: CryptoSubscriptionStatuses.ACTIVE;
    valid: true;
}

export interface CryptoExpiredSubscription extends BaseCryptoSubscription, CryptoDBStoredInfo {
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

// Telegram Subscription Types
export interface TelegramDBStoredInfo {
    expiresDate: Date;
}

export interface BaseTelegramSubscription extends BaseSubscription, TelegramDBStoredInfo {
    source: SubscriptionSource.TELEGRAM;
    status: TelegramSubscriptionStatuses;
    auth: TelegramAuth;
}

export interface TelegramActiveSubscription extends BaseTelegramSubscription {
    status: TelegramSubscriptionStatuses.ACTIVE;
    valid: true;
}

export interface TelegramExpiredSubscription extends BaseTelegramSubscription {
    status: TelegramSubscriptionStatuses.EXPIRED;
    valid: false;
}
