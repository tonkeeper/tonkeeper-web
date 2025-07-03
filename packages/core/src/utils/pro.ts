import {
    CryptoSubscriptionStatuses,
    IosSubscriptionStatuses,
    ProSubscription
} from '../entries/pro';
import { IStorage } from '../Storage';
import { SubscriptionSource } from '../pro';
import { Network } from '../entries/network';
import { isStandardTonWallet } from '../entries/wallet';
import { getNetworkByAccount } from '../entries/account';
import { accountsStorage } from '../service/accountsStorage';
import { ExtendedSubscriptionVerification, UserInfo } from './types';
import { walletVersionFromProServiceDTO } from '../service/proService';

export const normalizeSubscription = (
    subscriptionDto: ExtendedSubscriptionVerification | null | undefined,
    user: UserInfo
): ProSubscription => {
    const source = subscriptionDto?.source;
    const toDate = (ts?: number) => (ts ? new Date(ts * 1000) : undefined);

    if (!source || (source !== SubscriptionSource.CRYPTO && source !== SubscriptionSource.IOS)) {
        return null;
    }

    const valid = subscriptionDto.valid;
    const isTrial = subscriptionDto.is_trial;
    const usedTrial = subscriptionDto.used_trial ?? false;
    const nextChargeDate = toDate(subscriptionDto.next_charge);

    if (source === SubscriptionSource.CRYPTO) {
        if (isTrial) {
            return {
                source,
                status: CryptoSubscriptionStatuses.TRIAL,
                valid,
                isTrial: true,
                usedTrial: true,
                trialUserId: user.tg_id!,
                trialEndDate: nextChargeDate!
            };
        } else {
            return {
                source,
                status: CryptoSubscriptionStatuses.ACTIVE,
                valid: true,
                isTrial: false,
                usedTrial,
                nextChargeDate
            };
        }
    }

    if (source === SubscriptionSource.IOS) {
        if (isTrial) {
            return {
                source,
                status: IosSubscriptionStatuses.PROMO,
                valid,
                isTrial: true,
                usedTrial: true,
                trialEndDate: nextChargeDate!
            };
        } else {
            return {
                source,
                status: IosSubscriptionStatuses.ACTIVE,
                valid: true,
                isTrial: false,
                usedTrial,
                nextChargeDate
            };
        }
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
