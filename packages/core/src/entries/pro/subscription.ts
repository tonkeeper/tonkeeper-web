import {
    CryptoSubscriptionStatuses,
    ExtensionSubscriptionStatuses,
    IosSubscriptionStatuses,
    ProductIds,
    PurchaseStatuses,
    TelegramSubscriptionStatuses
} from './enums';
import {
    IIosPurchaseResult,
    IOriginalTransactionInfo,
    ITokenizedWalletAuth,
    ISubscriptionFormData,
    IDisplayPlan,
    ITelegramAuth,
    IWalletAuth
} from './common';
import { CryptoCurrency, SubscriptionSource } from '../../pro';
import { Language } from '../language';

export type ProSubscription =
    | IosSubscription
    | ExtensionSubscription
    | CryptoSubscription
    | TelegramSubscription
    | null;

export type IosSubscription = IIosActiveSubscription | IIosExpiredSubscription;

export type ExtensionSubscription =
    | IExtensionActiveSubscription
    | IExtensionExpiredSubscription
    | IExtensionPendingSubscription;

export type CryptoSubscription =
    | ICryptoActiveSubscription
    | ICryptoExpiredSubscription
    | ICryptoPendingSubscription;

export type TelegramSubscription = ITelegramActiveSubscription | ITelegramExpiredSubscription;

export type SubscriptionStrategy =
    | IIosSubscriptionStrategy
    | ICryptoSubscriptionStrategy
    | IExtensionSubscriptionStrategy;

export interface IBaseSubscription {
    source: SubscriptionSource;
    valid: boolean;
    nextChargeDate?: Date;
    auth: IWalletAuth | ITelegramAuth;
}

export interface IBaseSubscriptionStrategy {
    source: SubscriptionSource;
    subscribe(formData: ISubscriptionFormData): Promise<PurchaseStatuses>;
    getAllProductsInfoCore(lang?: Language): Promise<IDisplayPlan[]>;
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

// Extension Subscription Types
export interface IExtensionDBStoredInfo {
    contract: string;
    currency: CryptoCurrency;
    expiresDate: Date;
    amount: string;
    period: number;
    purchaseDate: Date;
    isAutoRenewable: boolean;
}

export interface IBaseExtensionSubscription extends IBaseSubscription {
    source: SubscriptionSource.EXTENSION;
    status: ExtensionSubscriptionStatuses;
    auth: IWalletAuth;
}

export interface IExtensionActiveSubscription
    extends IBaseExtensionSubscription,
        IExtensionDBStoredInfo {
    status: ExtensionSubscriptionStatuses.ACTIVE;
    valid: true;
}

export interface IExtensionExpiredSubscription
    extends IBaseExtensionSubscription,
        IExtensionDBStoredInfo {
    status: ExtensionSubscriptionStatuses.EXPIRED;
    valid: false;
}

export interface IExtensionPendingSubscription extends IBaseExtensionSubscription {
    status: ExtensionSubscriptionStatuses.PENDING;
    auth: ITokenizedWalletAuth;
    displayName?: string;
    displayPrice?: string;
}

export interface IExtensionSubscriptionStrategy extends IBaseSubscriptionStrategy {
    source: SubscriptionSource.EXTENSION;
    cancelSubscription(extensionContract: string): Promise<PurchaseStatuses>;
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

export interface ISubscriptionService {
    getAvailableSources(): ReadonlyArray<SubscriptionSource>;
    getStrategy(source: SubscriptionSource): SubscriptionStrategy | undefined;
    addStrategy(strategy: SubscriptionStrategy): void;
    logout(): Promise<void>;
    getSubscription(tempToken: string | null): Promise<ProSubscription>;
    getToken(): Promise<string | null>;
    subscribe(
        source: SubscriptionSource,
        formData: ISubscriptionFormData
    ): Promise<PurchaseStatuses>;
    activateTrial(token: string): Promise<void>;
    getAllProductsInfo(source: SubscriptionSource, lang?: Language): Promise<IDisplayPlan[]>;
}
