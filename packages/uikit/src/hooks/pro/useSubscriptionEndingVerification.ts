import { useEffect } from 'react';
import { useAppSdk } from '../appSdk';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { useProEndingNotification } from '../../components/modals/ProEndingNotificationControlled';
import { useProState } from '../../state/pro';
import {
    isIosAutoRenewableSubscription,
    isIosStrategy,
    isProSubscription
} from '@tonkeeper/core/dist/entries/pro';

enum ProEndingNotificationState {
    DAY = 'DAY',
    WEEK = 'WEEK'
}

export const useSubscriptionEndingVerification = () => {
    const sdk = useAppSdk();
    const { onOpen } = useProEndingNotification();
    const { data: subscription } = useProState();

    useEffect(() => {
        // TODO Fix crypto flow first to remove this condition
        if (!isIosStrategy(sdk.subscriptionStrategy)) return;

        if (!isProSubscription(subscription)) return;
        if (!subscription.nextChargeDate) return;
        if (isIosAutoRenewableSubscription(subscription)) return;

        const targetTime = subscription.nextChargeDate.getTime();
        const diffDays = (targetTime - Date.now()) / (1000 * 60 * 60 * 24);
        const isInDayPeriod = diffDays > 0 && diffDays <= 1;
        const isInWeekPeriod = diffDays > 1 && diffDays <= 7;

        const shouldShow: ProEndingNotificationState | null = isInDayPeriod
            ? ProEndingNotificationState.DAY
            : isInWeekPeriod
            ? ProEndingNotificationState.WEEK
            : null;

        if (!shouldShow) return;

        (async () => {
            const alreadyShown = await sdk.storage.get<ProEndingNotificationState | null>(
                AppKey.PRO_ENDING_NOTIFICATION_STATE
            );

            if (alreadyShown === ProEndingNotificationState.DAY || alreadyShown === shouldShow) {
                return;
            }

            await sdk.storage.set(AppKey.PRO_ENDING_NOTIFICATION_STATE, shouldShow);
            onOpen();
        })();
    }, [subscription]);
};
