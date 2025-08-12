import {
    AuthTypes,
    CryptoSubscriptionStatuses,
    IosSubscriptionStatuses,
    isProductId,
    ProductIds,
    ProStateWallet,
    ProSubscription,
    TelegramSubscriptionStatuses
} from '../entries/pro';
import { UserInfo } from './types';
import { IStorage } from '../Storage';
import { Network } from '../entries/network';
import { isStandardTonWallet } from '../entries/wallet';
import { getNetworkByAccount } from '../entries/account';
import { accountsStorage } from '../service/accountsStorage';
import { TON_ASSET } from '../entries/crypto/asset/constants';
import { AssetAmount } from '../entries/crypto/asset/asset-amount';
import { SubscriptionSource, SubscriptionVerification } from '../pro';
import { walletVersionFromProServiceDTO } from '../service/proService';

export const normalizeSubscription = (
    subscriptionDto: SubscriptionVerification | null | undefined,
    authorizedWallet: ProStateWallet | null
): ProSubscription => {
    const source = subscriptionDto?.source;
    const toDate = (ts: number) => new Date(ts * 1000);

    if (!source) {
        return null;
    }

    const valid = subscriptionDto.valid;
    const nextChargeDate = subscriptionDto.next_charge
        ? new Date(subscriptionDto.next_charge * 1000)
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

export const findAuthorizedWallet = async (user: UserInfo, storage: IStorage) => {
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

    return {
        publicKey: actualWallet.publicKey,
        rawAddress: actualWallet.rawAddress
    };
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

// TODO Put BASE_URL into config
export const BASE_SLIDE_URL = 'https://tonkeeper.com/assets/stories/prosubscriptions';
