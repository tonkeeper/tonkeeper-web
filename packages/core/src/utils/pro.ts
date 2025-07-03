import {
    CryptoSubscriptionStatuses,
    IosSubscriptionStatuses,
    ProSubscription,
    SubscriptionSources
} from '../entries/pro';
import { IStorage } from '../Storage';
import { Network } from '../entries/network';
import { isStandardTonWallet } from '../entries/wallet';
import { getNetworkByAccount } from '../entries/account';
import { accountsStorage } from '../service/accountsStorage';
import { ExtendedSubscriptionVerification, UserInfo } from './types';
import { walletVersionFromProServiceDTO } from '../service/proService';

export const toEmptySubscription = (): ProSubscription => {
    return {
        source: SubscriptionSources.EMPTY,
        valid: false,
        isTrial: false,
        usedTrial: false
    };
};

export const normalizeSubscription = (
    subscriptionDto: ExtendedSubscriptionVerification,
    user: UserInfo
): ProSubscription => {
    const source = subscriptionDto?.source;
    const toDate = (ts?: number) => (ts ? new Date(ts * 1000) : undefined);

    if (!source || typeof source !== 'string' || !subscriptionDto.valid) {
        return toEmptySubscription();
    }

    if (source === SubscriptionSources.CRYPTO) {
        if (subscriptionDto.is_trial) {
            return {
                source: SubscriptionSources.CRYPTO,
                status: CryptoSubscriptionStatuses.TRIAL,
                valid: true,
                isTrial: true,
                usedTrial: true,
                trialUserId: user.tg_id!,
                trialEndDate: toDate(subscriptionDto.next_charge)!
            };
        } else {
            return {
                source: SubscriptionSources.CRYPTO,
                status: CryptoSubscriptionStatuses.ACTIVE,
                valid: true,
                isTrial: false,
                usedTrial: subscriptionDto.used_trial ?? false,
                nextChargeDate: toDate(subscriptionDto.next_charge)
            };
        }
    }

    if (source === SubscriptionSources.IOS) {
        if (!subscriptionDto.original_transaction_id) {
            return toEmptySubscription();
        }

        if (subscriptionDto.is_trial) {
            return {
                source: SubscriptionSources.IOS,
                status: IosSubscriptionStatuses.PROMO,
                valid: true,
                isTrial: true,
                usedTrial: true,
                trialEndDate: toDate(subscriptionDto.next_charge)!,
                originalTransactionId: subscriptionDto.original_transaction_id
            };
        } else {
            return {
                source: SubscriptionSources.IOS,
                status: IosSubscriptionStatuses.ACTIVE,
                valid: true,
                isTrial: false,
                usedTrial: subscriptionDto.used_trial ?? false,
                nextChargeDate: toDate(subscriptionDto.next_charge),
                originalTransactionId: subscriptionDto.original_transaction_id
            };
        }
    }

    return toEmptySubscription();
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
