import { useEffect } from 'react';
import { useAppSdk } from '../appSdk';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { useProEndingNotification } from '../../components/modals/ProEndingNotificationControlled';
import { useProState } from '../../state/pro';
import {
    isExtensionAutoRenewableSubscription,
    isIosAutoRenewableSubscription,
    isProSubscription
} from '@tonkeeper/core/dist/entries/pro';

enum ProEndingNotificationState {
    DAY = 'DAY',
    WEEK = 'WEEK',
    EXPIRED = 'EXPIRED'
}

export const useSubscriptionEndingVerification = () => {
    const sdk = useAppSdk();
    const { data: subscription } = useProState();
    const { onOpen } = useProEndingNotification();

    useEffect(() => {
        if (!isProSubscription(subscription)) return;
        if (!subscription.nextChargeDate) return;
        if (isIosAutoRenewableSubscription(subscription)) return;
        if (isExtensionAutoRenewableSubscription(subscription)) return;

        const targetTime = subscription.nextChargeDate.getTime();
        const diffDays = (targetTime - Date.now()) / (1000 * 60 * 60 * 24);

        const isExpired = diffDays <= 0;
        const isInDayPeriod = diffDays > 0 && diffDays <= 1;
        const isInWeekPeriod = diffDays > 1 && diffDays <= 7;

        const shouldShow: ProEndingNotificationState | null = isExpired
            ? ProEndingNotificationState.EXPIRED
            : isInDayPeriod
            ? ProEndingNotificationState.DAY
            : isInWeekPeriod
            ? ProEndingNotificationState.WEEK
            : null;

        if (!shouldShow) return;

        (async () => {
            let alreadyShown =
                (await sdk.storage.get<
                    ProEndingNotificationState | ProEndingNotificationState[] | null
                >(AppKey.PRO_ENDING_NOTIFICATION_STATE)) ?? [];

            if (!Array.isArray(alreadyShown)) {
                alreadyShown = [alreadyShown];
            }

            if (alreadyShown.includes(shouldShow)) {
                return;
            }

            const updated = [...(alreadyShown ?? []), shouldShow];
            await sdk.storage.set(AppKey.PRO_ENDING_NOTIFICATION_STATE, updated);

            onOpen();
        })();
    }, [subscription]);
};
