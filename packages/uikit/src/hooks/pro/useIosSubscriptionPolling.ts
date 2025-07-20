import { useEffect } from 'react';
import {
    hasWalletAuth,
    isIosSubscription,
    isPendingSubscription
} from '@tonkeeper/core/dist/entries/pro';
import { saveIapPurchase } from '@tonkeeper/core/dist/service/proService';

import { useOriginalTransactionInfo, useProState } from '../../state/pro';

export const useIosSubscriptionPolling = (intervalMs = 10000) => {
    const { data: proState, refetch } = useProState();
    const { data: originalTxInfo } = useOriginalTransactionInfo();

    const subscription = proState?.current;

    useEffect(() => {
        if (!subscription) return;
        if (!hasWalletAuth(subscription)) return;
        if (!isIosSubscription(subscription)) return;
        if (!isPendingSubscription(subscription)) return;

        const { originalTransactionId } = subscription;
        const finalOriginalTxId = originalTransactionId || originalTxInfo?.originalTransactionId;

        if (!finalOriginalTxId) return;

        let isMounted = true;
        const resaveIosPurchase = async () => {
            const result = await saveIapPurchase(String(finalOriginalTxId));

            if (result.ok && isMounted) {
                void refetch();
            }
        };

        const interval = setInterval(resaveIosPurchase, intervalMs);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [originalTxInfo, subscription, refetch]);
};
