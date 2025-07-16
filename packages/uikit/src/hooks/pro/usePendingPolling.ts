import { useEffect } from 'react';
import {
    isCryptoSubscription,
    isIosSubscription,
    isPendingSubscription,
    isProSubscription
} from '@tonkeeper/core/dist/entries/pro';
import { useProState } from '../../state/pro';
import { saveIapPurchase } from '@tonkeeper/core/dist/service/proService';

export const usePendingPolling = (intervalMs = 10000) => {
    const { data, refetch } = useProState();
    const subscription = data?.current;

    useEffect(() => {
        if (!isProSubscription(subscription) || !isPendingSubscription(subscription)) return;
        if (!isCryptoSubscription(subscription)) return;

        const interval = setInterval(() => {
            void refetch();
        }, intervalMs);

        return () => clearInterval(interval);
    }, [subscription, refetch, intervalMs]);

    useEffect(() => {
        if (!isProSubscription(subscription) || !isPendingSubscription(subscription)) return;
        if (!isIosSubscription(subscription)) return;

        const resaveIosPurchase = async () => {
            const { originalTransactionId } = subscription;
            if (!originalTransactionId) return;

            const result = await saveIapPurchase(String(originalTransactionId));
            if (result.ok) {
                void refetch();
            }
        };

        const interval = setInterval(resaveIosPurchase, intervalMs);

        return () => clearInterval(interval);
    }, [subscription, refetch, intervalMs]);
};
