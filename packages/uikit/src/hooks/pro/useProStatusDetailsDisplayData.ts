import {
    CryptoSubscriptionStatuses,
    hasIosPrice,
    isCryptoSubscription,
    isExpiredSubscription,
    isIosAutoRenewableSubscription,
    isIosCanceledSubscription,
    isIosSubscription,
    isPendingSubscription,
    isTelegramSubscription,
    isValidSubscription,
    ProSubscription
} from '@tonkeeper/core/dist/entries/pro';

import { useTranslation } from '../translation';
import { useDateTimeFormat } from '../useDateTimeFormat';
import { getFormattedProPrice } from '@tonkeeper/core/dist/utils/pro';

export const useProStatusDetailsDisplayData = (subscription: ProSubscription | undefined) => {
    const { t } = useTranslation();
    const formatDate = useDateTimeFormat();

    const isValidSub = isValidSubscription(subscription);
    const isCryptoSub = isCryptoSubscription(subscription);
    const isPendingSub = isPendingSubscription(subscription);
    const isExpiredSub = isExpiredSubscription(subscription);

    const isIosSub = isIosSubscription(subscription);
    const isCanceled = isIosCanceledSubscription(subscription);
    const isAutoRenew = isIosAutoRenewableSubscription(subscription);

    const getPrice = () => {
        if (!subscription) return '-';

        if (isPendingSub) {
            return subscription.displayPrice;
        }

        if (isCryptoSub) {
            return getFormattedProPrice(subscription.amount, true);
        }

        if (isIosSub && hasIosPrice(subscription)) {
            const { price, currency } = subscription;

            if (!price || !currency) return '-';

            // TODO WHY 1000? No idea, needs to be figured out
            return `${currency} ${(price / 1000).toFixed(2)}`;
        }

        return 'free';
    };

    const getExpirationDate = () => {
        try {
            if (isValidSub && subscription.nextChargeDate) {
                return formatDate(subscription.nextChargeDate, {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                });
            }

            if (isExpiredSub && subscription.expiresDate) {
                return formatDate(subscription.expiresDate, {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                });
            }

            return '-';
        } catch (e) {
            console.error('During formatDate error: ', e);

            return '-';
        }
    };

    const getExpirationTitle = () => {
        if (isAutoRenew || isCanceled) {
            return t(isAutoRenew ? 'renews' : 'ends');
        }

        return t('expiration_date');
    };

    const getStatusText = () => {
        if (!subscription) return '-';

        if (subscription.status === CryptoSubscriptionStatuses.PENDING) {
            return `${t('processing')}...`;
        }

        const trialSuffix = isTelegramSubscription(subscription) ? ` (${t('trial')})` : '';

        return `${t(subscription.status)}${trialSuffix}`;
    };

    const getStatusColor = () => {
        if (!subscription) return undefined;

        if (subscription.status === CryptoSubscriptionStatuses.PENDING) {
            return 'textSecondary';
        }

        if (isExpiredSub) {
            return 'accentOrange';
        }

        return undefined;
    };

    const getPaymentType = () => {
        if (isIosSub) {
            return t('in_app_purchase');
        }

        if (isCryptoSub) {
            return t('crypto_payment');
        }

        return null;
    };

    const getPromoCode = () => {
        if (!isCryptoSub) return null;

        return subscription?.promoCode || null;
    };

    return {
        [t('status')]: {
            color: getStatusColor(),
            value: getStatusText()
        },
        [getExpirationTitle()]: {
            value: getExpirationDate()
        },
        [t('auto_renew')]: {
            isVisible: isCanceled || isAutoRenew,
            color: isCanceled ? 'accentOrange' : undefined,
            value: t(isCanceled ? 'disabled' : 'enabled')
        },
        [t('price')]: {
            isVisible: getPrice(),
            value: getPrice()
        },
        [t('type')]: {
            isVisible: getPaymentType(),
            value: getPaymentType()
        },
        [t('promo_code')]: {
            isVisible: getPromoCode(),
            value: getPromoCode(),
            textTransform: 'uppercase'
        }
    };
};
