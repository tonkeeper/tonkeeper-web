import { useEffect } from 'react';
import { hasWalletAuth, isIosStrategy, isProSubscription } from '@tonkeeper/core/dist/entries/pro';
import { saveIapPurchase } from '@tonkeeper/core/dist/service/proService';

import { useOriginalTransactionInfo, useProState } from '../../state/pro';
import { useAppSdk } from '../appSdk';

export const useIosSubscriptionPolling = (intervalMs = 10000) => {
    const sdk = useAppSdk();
    const { data: subscription, refetch } = useProState();
    const { data: originalTxInfo } = useOriginalTransactionInfo();

    useEffect(() => {
        if (!isIosStrategy(sdk.subscriptionStrategy)) return;
        if (!hasWalletAuth(subscription)) return;
        if (isProSubscription(subscription)) return;

        const originalTransactionId = originalTxInfo?.originalTransactionId;

        if (!originalTransactionId) return;

        let isMounted = true;
        const resaveIosPurchase = async () => {
            const mainToken = await sdk.subscriptionStrategy.getToken();

            if (!mainToken) return;

            const result = await saveIapPurchase(mainToken, String(originalTransactionId));

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
