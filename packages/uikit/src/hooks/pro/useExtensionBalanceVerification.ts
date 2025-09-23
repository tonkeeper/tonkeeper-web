import { useEffect } from 'react';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { AccountsApi } from '@tonkeeper/core/dist/tonApiV2';
import { isExtensionAutoRenewableSubscription } from '@tonkeeper/core/dist/entries/pro';

import { useAppSdk } from '../appSdk';
import { useProState } from '../../state/pro';
import { useActiveApi } from '../../state/wallet';
import { useProBalanceNotification } from '../../components/modals/ProBalanceNotificationControlled';

enum ProBalanceNotificationState {
    DAY = 'DAY',
    THREE_DAYS = 'THREE_DAYS'
}

export const useExtensionBalanceVerification = () => {
    const sdk = useAppSdk();
    const api = useActiveApi();
    const { data: subscription } = useProState();
    const { onOpen } = useProBalanceNotification();

    useEffect(() => {
        if (!subscription) {
            return;
        }

        if (!subscription.nextChargeDate) return;
        if (!isExtensionAutoRenewableSubscription(subscription)) return;

        const targetTime = subscription.nextChargeDate.getTime();
        const diffDays = (targetTime - Date.now()) / (1000 * 60 * 60 * 24);
        const isInDayPeriod = diffDays > 0 && diffDays <= 1;
        const isInThreeDaysPeriod = diffDays > 1 && diffDays <= 3;

        const shouldShow: ProBalanceNotificationState | null = isInDayPeriod
            ? ProBalanceNotificationState.DAY
            : isInThreeDaysPeriod
            ? ProBalanceNotificationState.THREE_DAYS
            : null;

        if (!shouldShow) return;

        (async () => {
            try {
                const wallet = subscription.auth.wallet!;

                const accInfo = await new AccountsApi(api.tonApiV2).getAccount({
                    accountId: wallet.rawAddress
                });

                const isEnoughBalance = BigInt(accInfo.balance) > BigInt(subscription.amount);

                if (isEnoughBalance) return;

                const alreadyShown = await sdk.storage.get<ProBalanceNotificationState | null>(
                    AppKey.PRO_BALANCE_NOTIFICATION_STATE
                );

                if (!alreadyShown || !alreadyShown.includes(shouldShow)) {
                    const updated = [...(alreadyShown ?? []), shouldShow];
                    await sdk.storage.set(AppKey.PRO_BALANCE_NOTIFICATION_STATE, updated);

                    onOpen();
                }
            } catch (e) {
                console.error('Failed to verify balance for extension: ', e);
            }
        })();
    }, [subscription]);
};
