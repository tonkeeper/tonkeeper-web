import {
    AuthTypes,
    CryptoSubscriptionStatuses,
    IosSubscriptionStatuses,
    ProductIds,
    PurchaseErrors,
    TelegramSubscriptionStatuses
} from './enums';
import {
    ICryptoExpiredSubscription,
    CryptoSubscription,
    IIosSubscriptionStrategy,
    IIosExpiredSubscription,
    IosSubscription,
    ProSubscription,
    SubscriptionStrategy,
    ITelegramExpiredSubscription,
    TelegramSubscription,
    IIosActiveSubscription,
    ICryptoActiveSubscription,
    ITelegramActiveSubscription,
    IExtensionSubscriptionStrategy
} from './subscription';
import { TonWalletStandard } from '../wallet';
import { SubscriptionSource } from '../../pro';
import { IWalletAuth } from './common';

export function isProductId(value: unknown): value is ProductIds {
    return typeof value === 'string' && Object.values(ProductIds).includes(value as ProductIds);
}

export function isPurchaseError(value: unknown): value is PurchaseErrors {
    return (
        typeof value === 'string' && Object.values(PurchaseErrors).includes(value as PurchaseErrors)
    );
}

export function isStrategy(strategy?: unknown): strategy is SubscriptionStrategy {
    return (
        strategy !== null &&
        typeof strategy === 'object' &&
        'source' in strategy &&
        'subscribe' in strategy
    );
}

export function isIosStrategy(strategy?: unknown): strategy is IIosSubscriptionStrategy {
    return isStrategy(strategy) && strategy?.source === SubscriptionSource.IOS;
}

export function isExtensionStrategy(strategy: unknown): strategy is IExtensionSubscriptionStrategy {
    return isStrategy(strategy) && strategy?.source === SubscriptionSource.EXTENSION;
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
    value: unknown
): value is Exclude<ProSubscription, null | undefined> {
    return isProSubscription(value) && value.valid;
}

export function isExpiredSubscription(
    subscription: unknown
): subscription is
    | IIosExpiredSubscription
    | ICryptoExpiredSubscription
    | ITelegramExpiredSubscription {
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
): value is IIosActiveSubscription | ICryptoActiveSubscription {
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

export function isIosAutoRenewableSubscription(value: unknown): value is IIosActiveSubscription & {
    autoRenewStatus: true;
} {
    return (
        isPaidActiveSubscription(value) &&
        isIosSubscription(value) &&
        value?.autoRenewStatus === true
    );
}

export function isIosExpiredSubscription(value: unknown): value is IIosExpiredSubscription {
    return isIosSubscription(value) && value.status === IosSubscriptionStatuses.EXPIRED;
}

export function isIosCanceledSubscription(
    value: unknown
): value is IIosActiveSubscription & { autoRenewStatus: false } {
    return (
        isIosSubscription(value) &&
        value.status === IosSubscriptionStatuses.ACTIVE &&
        !value.autoRenewStatus
    );
}

export function isTelegramSubscription(value: unknown): value is TelegramSubscription {
    return isProSubscription(value) && value?.source === SubscriptionSource.TELEGRAM;
}

export function isTelegramActiveSubscription(value: unknown): value is ITelegramActiveSubscription {
    return (
        isTelegramSubscription(value) &&
        value?.source === SubscriptionSource.TELEGRAM &&
        value?.status === TelegramSubscriptionStatuses.ACTIVE
    );
}

export function isTonWalletStandard(wallet: unknown): wallet is TonWalletStandard {
    return (
        wallet !== null &&
        typeof wallet === 'object' &&
        'id' in wallet &&
        'version' in wallet &&
        'publicKey' in wallet
    );
}

export function hasIosPrice(
    subscription: IosSubscription
): subscription is IIosActiveSubscription | IIosExpiredSubscription {
    return (
        subscription.status === IosSubscriptionStatuses.ACTIVE ||
        subscription.status === IosSubscriptionStatuses.EXPIRED
    );
}

export function hasWalletAuth(value?: unknown): value is { auth: IWalletAuth } {
    return (
        isProSubscription(value) &&
        'auth' in value &&
        value.auth?.type === AuthTypes.WALLET &&
        'wallet' in value.auth
    );
}
