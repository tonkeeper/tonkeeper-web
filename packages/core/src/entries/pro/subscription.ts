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
    ITokenizedWalletAuth,
    ISubscriptionConfig,
    ISubscriptionFormData,
    NormalizedProPlans,
    ITelegramAuth,
    IWalletAuth
} from './common';
import { Language } from '../language';
import { CryptoCurrency, SubscriptionSource } from '../../pro';

export type ProSubscription = IosSubscription | CryptoSubscription | TelegramSubscription | null;

export type IosSubscription = IIosActiveSubscription | IIosExpiredSubscription;

export type CryptoSubscription =
    | ICryptoActiveSubscription
    | ICryptoExpiredSubscription
    | ICryptoPendingSubscription;

export type TelegramSubscription = ITelegramActiveSubscription | ITelegramExpiredSubscription;

export type SubscriptionStrategy = ICryptoSubscriptionStrategy | IIosSubscriptionStrategy;

export interface IBaseSubscription {
    source: SubscriptionSource;
    valid: boolean;
    nextChargeDate?: Date;
    auth: IWalletAuth | ITelegramAuth;
}

export interface IBaseSubscriptionStrategy {
    source: SubscriptionSource;
    subscribe(
        formData: ISubscriptionFormData,
        config: ISubscriptionConfig
    ): Promise<PurchaseStatuses>;
    getSubscription(tempToken: string | null): Promise<ProSubscription>;
    getAllProductsInfo(lang?: Language, promoCode?: string): Promise<NormalizedProPlans>;
}

// IOS Subscription Types
export interface IIosDBStoredInfo {
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

export interface IBaseIosSubscription extends IBaseSubscription, IIosDBStoredInfo {
    source: SubscriptionSource.IOS;
    status: IosSubscriptionStatuses;
    auth: IWalletAuth;
}

export interface IIosActiveSubscription extends IBaseIosSubscription {
    status: IosSubscriptionStatuses.ACTIVE;
    valid: true;
    autoRenewStatus: boolean;
}

export interface IIosExpiredSubscription extends IBaseIosSubscription {
    status: IosSubscriptionStatuses.EXPIRED;
    valid: false;
    autoRenewStatus: false;
}

export interface IIosSubscriptionStrategy extends IBaseSubscriptionStrategy {
    source: SubscriptionSource.IOS;
    manageSubscriptions(): Promise<void>;
    getOriginalTransactionId(): Promise<IOriginalTransactionInfo>;
    getCurrentSubscriptionInfo(): Promise<IIosPurchaseResult[]>;
}

// Crypto Subscription Types
export interface ICryptoDBStoredInfo {
    amount: string;
    currency: CryptoCurrency;
    expiresDate: Date;
    purchaseDate: Date;
    promoCode?: string;
}

export interface IBaseCryptoSubscription extends IBaseSubscription {
    source: SubscriptionSource.CRYPTO;
    status: CryptoSubscriptionStatuses;
    auth: IWalletAuth;
}

export interface ICryptoActiveSubscription extends IBaseCryptoSubscription, ICryptoDBStoredInfo {
    status: CryptoSubscriptionStatuses.ACTIVE;
    valid: true;
}

export interface ICryptoExpiredSubscription extends IBaseCryptoSubscription, ICryptoDBStoredInfo {
    status: CryptoSubscriptionStatuses.EXPIRED;
    valid: false;
}

export interface ICryptoPendingSubscription extends IBaseCryptoSubscription {
    status: CryptoSubscriptionStatuses.PENDING;
    auth: ITokenizedWalletAuth;
    displayName?: string;
    displayPrice?: string;
    promoCode?: string;
}

export interface ICryptoSubscriptionStrategy extends IBaseSubscriptionStrategy {
    source: SubscriptionSource.CRYPTO;
}

// Telegram Subscription Types
export interface ITelegramDBStoredInfo {
    expiresDate: Date;
}

export interface IBaseTelegramSubscription extends IBaseSubscription, ITelegramDBStoredInfo {
    source: SubscriptionSource.TELEGRAM;
    status: TelegramSubscriptionStatuses;
    auth: ITelegramAuth;
}

export interface ITelegramActiveSubscription extends IBaseTelegramSubscription {
    status: TelegramSubscriptionStatuses.ACTIVE;
    valid: true;
}

export interface ITelegramExpiredSubscription extends IBaseTelegramSubscription {
    status: TelegramSubscriptionStatuses.EXPIRED;
    valid: false;
}
