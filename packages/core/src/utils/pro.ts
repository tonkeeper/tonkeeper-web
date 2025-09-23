import { IStorage } from '../Storage';
import { Network } from '../entries/network';
import { isStandardTonWallet, TonWalletStandard } from '../entries/wallet';
import { getNetworkByAccount } from '../entries/account';
import { accountsStorage } from '../service/accountsStorage';
import { TON_ASSET } from '../entries/crypto/asset/constants';
import { AssetAmount } from '../entries/crypto/asset/asset-amount';
import { SubscriptionExtensionStatus, SubscriptionSource, SubscriptionVerification } from '../pro';
import { walletVersionFromProServiceDTO } from '../service/proService';
import {
    AuthTypes,
    CryptoSubscriptionStatuses,
    ExtensionSubscriptionStatuses,
    hasExpiresDate,
    hasIosPrice,
    IosSubscriptionStatuses,
    isCryptoSubscription,
    isExpiredSubscription,
    isExtensionPendingCancelSubscription,
    isExtensionSubscription,
    isPendingSubscription,
    isProductId,
    isProSubscription,
    isValidSubscription,
    IUserInfo,
    ProductIds,
    ProSubscription,
    TelegramSubscriptionStatuses
} from '../entries/pro';
import { toStructTimeLeft } from './date';

export const normalizeSubscription = (
    subscriptionDto: SubscriptionVerification | null | undefined,
    authorizedWallet: TonWalletStandard | null
): ProSubscription => {
    const source = subscriptionDto?.source;
    const toDate = (ts: number) => new Date(ts * 1000);

    if (!source) {
        return null;
    }

    const valid = subscriptionDto.valid;
    const nextChargeDate = subscriptionDto.next_charge
        ? toDate(subscriptionDto.next_charge)
        : undefined;

    if (source === SubscriptionSource.TELEGRAM) {
        const dBStoredInfo = subscriptionDto?.telegram;

        if (dBStoredInfo === undefined) {
            throw new Error('Missing telegram dBStoredInfo');
        }

        if (valid) {
            return {
                source,
                status: TelegramSubscriptionStatuses.ACTIVE,
                valid: true,
                nextChargeDate,
                auth: {
                    type: AuthTypes.TELEGRAM
                },
                expiresDate: toDate(dBStoredInfo.expires_date)
            };
        }

        return {
            source,
            status: TelegramSubscriptionStatuses.EXPIRED,
            valid: false,
            nextChargeDate,
            auth: {
                type: AuthTypes.TELEGRAM
            },
            expiresDate: toDate(dBStoredInfo.expires_date)
        };
    }

    if (source === SubscriptionSource.EXTENSION && authorizedWallet) {
        const dBStoredInfo = subscriptionDto?.extension;
        const extensionExpiresDate = dBStoredInfo?.expiration_date
            ? toDate(dBStoredInfo.expiration_date)
            : undefined;
        const extensionNextChargeDate = nextChargeDate ?? extensionExpiresDate;

        if (dBStoredInfo === undefined) {
            throw new Error('Missing crypto dBStoredInfo');
        }

        if (valid) {
            return {
                source,
                status: ExtensionSubscriptionStatuses.ACTIVE,
                valid: true,
                nextChargeDate: extensionNextChargeDate,
                auth: {
                    type: AuthTypes.WALLET,
                    wallet: authorizedWallet
                },
                contract: dBStoredInfo.contract,
                currency: dBStoredInfo.currency,
                expiresDate: extensionExpiresDate,
                amount: dBStoredInfo.payment_per_period,
                period: dBStoredInfo.period,
                purchaseDate: toDate(dBStoredInfo.created_at),
                isAutoRenewable: dBStoredInfo.status === SubscriptionExtensionStatus.ACTIVE
            };
        }

        return {
            source,
            status: ExtensionSubscriptionStatuses.EXPIRED,
            valid: false,
            nextChargeDate,
            auth: {
                type: AuthTypes.WALLET,
                wallet: authorizedWallet
            },
            contract: dBStoredInfo.contract,
            currency: dBStoredInfo.currency,
            expiresDate: dBStoredInfo?.expiration_date
                ? toDate(dBStoredInfo.expiration_date)
                : undefined,
            amount: dBStoredInfo.payment_per_period,
            period: dBStoredInfo.period,
            purchaseDate: toDate(dBStoredInfo.created_at),
            isAutoRenewable: false
        };
    }

    if (source === SubscriptionSource.CRYPTO && authorizedWallet) {
        const dBStoredInfo = subscriptionDto?.crypto;

        if (dBStoredInfo === undefined) {
            throw new Error('Missing crypto dBStoredInfo');
        }

        if (valid) {
            return {
                source,
                status: CryptoSubscriptionStatuses.ACTIVE,
                valid: true,
                nextChargeDate,
                auth: {
                    type: AuthTypes.WALLET,
                    wallet: authorizedWallet
                },
                amount: dBStoredInfo.amount,
                currency: dBStoredInfo.currency,
                promoCode: dBStoredInfo.promo_code,
                purchaseDate: toDate(dBStoredInfo.purchase_date),
                expiresDate: toDate(dBStoredInfo.expires_date)
            };
        }

        return {
            source,
            status: CryptoSubscriptionStatuses.EXPIRED,
            valid: false,
            nextChargeDate,
            auth: {
                type: AuthTypes.WALLET,
                wallet: authorizedWallet
            },
            amount: dBStoredInfo.amount,
            currency: dBStoredInfo.currency,
            promoCode: dBStoredInfo.promo_code,
            purchaseDate: toDate(dBStoredInfo.purchase_date),
            expiresDate: toDate(dBStoredInfo.expires_date)
        };
    }

    if (source === SubscriptionSource.IOS && authorizedWallet) {
        const dBStoredInfo = subscriptionDto?.ios;

        if (dBStoredInfo === undefined) {
            throw new Error('Missing ios dBStoredInfo');
        }

        const productId = dBStoredInfo.product_id;

        if (!isProductId(productId)) {
            throw new Error('ProductId is incorrect or missed');
        }

        if (valid) {
            return {
                source,
                status: IosSubscriptionStatuses.ACTIVE,
                valid: true,
                nextChargeDate,
                auth: {
                    type: AuthTypes.WALLET,
                    wallet: authorizedWallet
                },
                txId: dBStoredInfo.tx_id,
                price: dBStoredInfo.price,
                priceMultiplier: dBStoredInfo.price_multiplier,
                currency: dBStoredInfo.currency,
                expiresDate: toDate(dBStoredInfo.expires_date),
                productId,
                storeFront: dBStoredInfo.store_front,
                storeFrontId: dBStoredInfo.store_front_id,
                transactionType: dBStoredInfo.transaction_type,
                purchaseDate: toDate(dBStoredInfo.purchase_date),
                originalTransactionId: dBStoredInfo.original_tx_id,
                autoRenewStatus: dBStoredInfo.auto_renew_status
            };
        }

        return {
            source,
            status: IosSubscriptionStatuses.EXPIRED,
            valid: false,
            nextChargeDate,
            auth: {
                type: AuthTypes.WALLET,
                wallet: authorizedWallet
            },
            txId: dBStoredInfo.tx_id,
            price: dBStoredInfo.price,
            priceMultiplier: dBStoredInfo.price_multiplier,
            currency: dBStoredInfo.currency,
            expiresDate: toDate(dBStoredInfo.expires_date),
            productId,
            storeFront: dBStoredInfo.store_front,
            storeFrontId: dBStoredInfo.store_front_id,
            transactionType: dBStoredInfo.transaction_type,
            purchaseDate: toDate(dBStoredInfo.purchase_date),
            originalTransactionId: dBStoredInfo.original_tx_id,
            autoRenewStatus: false
        };
    }

    return null;
};

export const findAuthorizedWallet = async (user: IUserInfo, storage: IStorage) => {
    if (!user.pub_key || !user.version) return null;
    const wallets = (await accountsStorage(storage).getAccounts())
        .filter(a => getNetworkByAccount(a) === Network.MAINNET)
        .flatMap(a => a.allTonWallets)
        .filter(isStandardTonWallet);

    const actualWallet = wallets.find(
        w =>
            w.publicKey === user.pub_key &&
            user.version &&
            w.version === walletVersionFromProServiceDTO(user.version)
    );

    if (!actualWallet) return null;

    return actualWallet;
};

export const isValidNanoString = (value: string): boolean => {
    return /^\d+$/.test(value);
};

export function trimEmptyDecimals(text: string): string {
    return text.replace(/(-?\d+)\.00(?!\d)/g, '$1');
}

export const getFormattedProPrice = (displayPrice: string | null, isCrypto: boolean): string => {
    try {
        if (!displayPrice) return '-';

        if (isCrypto) {
            const assetAmount = new AssetAmount({ weiAmount: displayPrice, asset: TON_ASSET });

            return isValidNanoString(displayPrice)
                ? trimEmptyDecimals(assetAmount.toStringAssetRelativeAmount(2))
                : '-';
        }

        return displayPrice;
    } catch (e) {
        console.error('getFormattedDisplayPrice error: ', e);
        return '-';
    }
};

export const SUBSCRIPTION_PERIODS_MAP = new Map<ProductIds, string>([
    [ProductIds.MONTHLY, 'per_month']
]);

export const pickBestSubscription = (
    current: ProSubscription | null,
    target: ProSubscription | null
): ProSubscription | null => {
    if (isValidSubscription(target)) return target;
    if (isValidSubscription(current)) return current;

    if (isProSubscription(current)) return current;
    if (isProSubscription(target)) return target;

    return null;
};

type Translator = (text: string, replaces?: Record<string, string | number>) => string;

export const getStatusText = (subscription: ProSubscription, translator: Translator) => {
    if (!subscription) return '-';

    if (isPendingSubscription(subscription)) {
        return `${translator(
            isExtensionPendingCancelSubscription(subscription) ? 'cancelling' : 'processing'
        )}...`;
    }

    return `${translator(subscription.status)}`;
};

export const getStatusColor = (subscription: ProSubscription) => {
    if (!subscription) return undefined;

    if (isPendingSubscription(subscription)) {
        return 'textSecondary';
    }

    if (isExpiredSubscription(subscription)) {
        return 'accentOrange';
    }

    return undefined;
};

export const getExpirationDate = (
    subscription: ProSubscription,
    dateFormatter: (
        date: string | number | Date,
        options?:
            | (Intl.DateTimeFormatOptions & {
                  inputUnit?: 'seconds' | 'ms' | undefined;
              })
            | undefined
    ) => string
) => {
    try {
        if (isValidSubscription(subscription) && subscription.nextChargeDate) {
            return dateFormatter(subscription.nextChargeDate, { dateStyle: 'long' });
        }

        if (hasExpiresDate(subscription)) {
            return dateFormatter(subscription.expiresDate, { dateStyle: 'long' });
        }

        return '-';
    } catch (e) {
        console.error('During formatDate error: ', e);

        return '-';
    }
};

export const getCryptoSubscriptionPrice = (subscription: ProSubscription) => {
    if (
        !subscription ||
        !(isCryptoSubscription(subscription) || isExtensionSubscription(subscription))
    )
        return '-';

    if (isPendingSubscription(subscription)) {
        return subscription.displayPrice;
    }

    return getFormattedProPrice(subscription.amount, true);
};

export const getIosSubscriptionPrice = (subscription: ProSubscription, translator: Translator) => {
    if (!subscription) return '-';

    if (!hasIosPrice(subscription)) return '-';

    const { price, priceMultiplier, currency, productId } = subscription;

    if (!price || !currency) return '-';

    const proPeriod = SUBSCRIPTION_PERIODS_MAP.get(productId);
    let proPeriodTranslated = '';

    if (proPeriod) {
        proPeriodTranslated = ` / ${translator(proPeriod)}`;
    }

    return `${currency} ${(price / priceMultiplier).toFixed(2)}` + proPeriodTranslated;
};

export enum Units {
    YEAR = 'year',
    MONTH = 'month',
    WEEK = 'week',
    DAY = 'day',
    HOUR = 'hour',
    MINUTE = 'minute',
    SECOND = 'second'
}

type RuPluralForms = 'one' | 'few' | 'many' | 'other';

function pluralRu(count: number): RuPluralForms {
    const mod10 = count % 10;
    const mod100 = count % 100;

    if (mod10 === 1 && mod100 !== 11) return 'one';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'few';
    if (mod10 === 0 || (mod10 >= 5 && mod10 <= 9) || (mod100 >= 11 && mod100 <= 14)) return 'many';

    return 'other';
}

export interface FormatEveryPeriodOptions {
    // (30 days in seconds) => allowApproxMonthsYears ? 1 month : 30 days
    allowApproxMonthsYears?: boolean;

    // minUnit: 'minute' (5) => "Every minute" // not "Every 5 seconds"
    minUnit?: Units;
}

interface ISecondsToUnitCountReturnType {
    unit: Units;
    count: number;
    form: RuPluralForms;
}

export function secondsToUnitCount(
    seconds: number,
    opts?: FormatEveryPeriodOptions
): ISecondsToUnitCountReturnType {
    const safeSeconds = Math.max(1, Math.trunc(seconds));

    const { days, hours, minutes, seconds: sec } = toStructTimeLeft(safeSeconds * 1000);

    if (opts?.allowApproxMonthsYears === false) {
        if (days > 0) return { unit: Units.DAY, count: days, form: pluralRu(days) };
        if (hours > 0) return { unit: Units.HOUR, count: hours, form: pluralRu(hours) };
        if (minutes > 0) return { unit: Units.MINUTE, count: minutes, form: pluralRu(minutes) };

        return { unit: Units.SECOND, count: sec, form: pluralRu(sec) };
    }

    if (days >= 365) {
        const years = Math.floor(days / 365);

        return { unit: Units.YEAR, count: years, form: pluralRu(years) };
    }

    if (days >= 30) {
        const months = Math.floor(days / 30);

        return { unit: Units.MONTH, count: months, form: pluralRu(months) };
    }

    if (days >= 7) {
        const weeks = Math.floor(days / 7);

        return { unit: Units.WEEK, count: weeks, form: pluralRu(weeks) };
    }

    if (days > 0) return { unit: Units.DAY, count: days, form: pluralRu(days) };
    if (hours > 0) return { unit: Units.HOUR, count: hours, form: pluralRu(hours) };
    if (minutes > 0) return { unit: Units.MINUTE, count: minutes, form: pluralRu(minutes) };

    return { unit: Units.SECOND, count: sec, form: pluralRu(sec) };
}

// Should be used only for Pro Dev tools
export const isWalletInOrigin = () => window?.location?.origin.includes('wallet');
