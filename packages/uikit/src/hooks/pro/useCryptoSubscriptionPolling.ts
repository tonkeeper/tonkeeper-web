import { useEffect } from 'react';
import {
    hasWalletAuth,
    isCryptoSubscription,
    isPendingSubscription
} from '@tonkeeper/core/dist/entries/pro';

import { useProState } from '../../state/pro';

export const useCryptoSubscriptionPolling = (intervalMs = 10000) => {
    const { data, refetch } = useProState();
    const subscription = data?.current;

    useEffect(() => {
        if (!subscription) return;
        if (!hasWalletAuth(subscription)) return;
        if (!isCryptoSubscription(subscription)) return;
        if (!isPendingSubscription(subscription)) return;

        const interval = setInterval(() => {
            void refetch();
        }, intervalMs);

        return () => {
            clearInterval(interval);
        };
    }, [subscription, refetch, intervalMs]);
};
