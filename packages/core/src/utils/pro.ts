import {
    AuthTypes,
    CryptoSubscriptionStatuses,
    IosSubscriptionStatuses,
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
import { SubscriptionSource, SubscriptionVerification } from '../pro';
import { walletVersionFromProServiceDTO } from '../service/proService';

interface IAuthData {
    user: UserInfo;
    authorizedWallet: ProStateWallet | null;
}

export const normalizeSubscription = (
    subscriptionDto: SubscriptionVerification | null | undefined,
    authData: IAuthData
): ProSubscription => {
    const { user, authorizedWallet } = authData;
    const source = subscriptionDto?.source;
    const toDate = (ts?: number) => (ts ? new Date(ts * 1000) : undefined);

    if (!source) {
        return null;
    }

    const valid = subscriptionDto.valid;
    const usedTrial = subscriptionDto.used_trial ?? false;
    const nextChargeDate = toDate(subscriptionDto.next_charge);

    if (source === SubscriptionSource.TELEGRAM) {
        if (valid) {
            return {
                source,
                status: TelegramSubscriptionStatuses.ACTIVE,
                valid: true,
                usedTrial: true,
                nextChargeDate,
                auth: {
                    type: AuthTypes.TELEGRAM,
                    trialUserId: user.tg_id
                },
                expiresDate: toDate(subscriptionDto?.telegram?.expires_date)
            };
        }

        return {
            source,
            status: TelegramSubscriptionStatuses.EXPIRED,
            valid: false,
            usedTrial: true,
            nextChargeDate,
            auth: {
                type: AuthTypes.TELEGRAM,
                trialUserId: user.tg_id
            },
            expiresDate: toDate(subscriptionDto?.telegram?.expires_date)
        };
    }

    if (source === SubscriptionSource.CRYPTO && authorizedWallet) {
        if (valid) {
            return {
                source,
                status: CryptoSubscriptionStatuses.ACTIVE,
                valid: true,
                usedTrial,
                nextChargeDate,
                auth: {
                    type: AuthTypes.WALLET,
                    wallet: authorizedWallet
                },
                amount: subscriptionDto.crypto?.amount,
                currency: subscriptionDto.crypto?.currency,
                purchaseDate: toDate(subscriptionDto.crypto?.purchase_date),
                expiresDate: toDate(subscriptionDto.crypto?.expires_date)
            };
        }

        return {
            source,
            status: CryptoSubscriptionStatuses.EXPIRED,
            valid: false,
            usedTrial,
            nextChargeDate,
            auth: {
                type: AuthTypes.WALLET,
                wallet: authorizedWallet
            },
            amount: subscriptionDto.crypto?.amount,
            currency: subscriptionDto.crypto?.currency,
            purchaseDate: toDate(subscriptionDto.crypto?.purchase_date),
            expiresDate: toDate(subscriptionDto.crypto?.expires_date)
        };
    }

    if (source === SubscriptionSource.IOS && authorizedWallet) {
        if (valid) {
            return {
                source,
                status: IosSubscriptionStatuses.ACTIVE,
                valid: true,
                usedTrial,
                nextChargeDate,
                auth: {
                    type: AuthTypes.WALLET,
                    wallet: authorizedWallet
                },
                txId: subscriptionDto.ios?.tx_id,
                price: subscriptionDto.ios?.price,
                currency: subscriptionDto.ios?.currency,
                expiresDate: toDate(subscriptionDto.ios?.expires_date),
                productId: subscriptionDto.ios?.product_id,
                storeFront: subscriptionDto.ios?.store_front,
                storeFrontId: subscriptionDto.ios?.store_front_id,
                transactionType: subscriptionDto.ios?.transaction_type,
                originalTransactionId: subscriptionDto.ios?.original_tx_id,
                autoRenewStatus: subscriptionDto.ios?.auto_renew_status ?? false
            };
        }

        return {
            source,
            status: IosSubscriptionStatuses.EXPIRED,
            valid: false,
            usedTrial,
            nextChargeDate,
            auth: {
                type: AuthTypes.WALLET,
                wallet: authorizedWallet
            },
            txId: subscriptionDto.ios?.tx_id,
            price: subscriptionDto.ios?.price,
            currency: subscriptionDto.ios?.currency,
            expiresDate: toDate(subscriptionDto.ios?.expires_date),
            productId: subscriptionDto.ios?.product_id,
            storeFront: subscriptionDto.ios?.store_front,
            storeFrontId: subscriptionDto.ios?.store_front_id,
            transactionType: subscriptionDto.ios?.transaction_type,
            originalTransactionId: subscriptionDto.ios?.original_tx_id,
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
