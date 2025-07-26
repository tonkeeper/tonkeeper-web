import {
    hasIosPrice,
    isCryptoSubscription,
    isExpiredSubscription,
    isIosSubscription,
    isPendingSubscription,
    isValidSubscription,
    ProSubscription
} from '@tonkeeper/core/dist/entries/pro';

import { useDateTimeFormat } from '../useDateTimeFormat';
import { getFormattedProPrice } from '../../libs/pro';

export const useProStatusDetailsDisplayData = (subscription: ProSubscription | undefined) => {
    const formatDate = useDateTimeFormat();

    const getPrice = () => {
        if (!subscription) return '-';

        if (isPendingSubscription(subscription)) {
            return subscription.displayPrice;
        }

        if (isCryptoSubscription(subscription)) {
            // TODO We can't have amount for older users
            return subscription.amount ? getFormattedProPrice(subscription.amount, true) : '8 TON';
        }

        if (isIosSubscription(subscription) && hasIosPrice(subscription)) {
            const { price, currency } = subscription;

            if (!price || !currency) return '-';

            // TODO WHY 1000? No idea, needs to be figured out
            return `${currency} ${(price / 1000).toFixed(2)}`;
        }

        return 'free';
    };

    const getExpirationDate = () => {
        try {
            if (isValidSubscription(subscription) && subscription.nextChargeDate) {
                return formatDate(subscription.nextChargeDate, {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                });
            }

            if (isExpiredSubscription(subscription) && subscription.expiresDate) {
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

    return {
        price: getPrice(),
        expirationDate: getExpirationDate()
    };
};
