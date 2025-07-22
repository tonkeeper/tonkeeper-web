import { useEffect } from 'react';
import { IosPurchaseStatuses } from '@tonkeeper/core/dist/entries/pro';

import { useNotifyError, useToast } from '../useNotification';
import { useTranslation } from '../translation';
import { useNavigate } from '../router/useNavigate';
import { useCurrentSubscriptionInfo, useProSubscriptionPurchase } from '../../state/pro';
import { AppRoute, SettingsRoute } from '../../libs/routes';
import { useProPurchaseNotification } from '../../components/modals/ProPurchaseNotificationControlled';
import { useProAuthNotification } from '../../components/modals/ProAuthNotificationControlled';
import { useAppSdk } from '../appSdk';

export const useIosPurchaseFlow = () => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const toast = useToast();
    const navigate = useNavigate();

    const { onOpen: onProAuthOpen } = useProAuthNotification();
    const { onClose: onCurrentClose } = useProPurchaseNotification();
    const { data: currentSubInfo, isLoading: isSubInfoLoading } = useCurrentSubscriptionInfo();

    const {
        data: status,
        mutateAsync: startPurchasing,
        isSuccess,
        isLoading: isPurchasing,
        isError
    } = useProSubscriptionPurchase();
    useNotifyError(isError && new Error(t('purchase_failed')));

    useEffect(() => {
        if (!currentSubInfo || currentSubInfo.length < 1) return;

        const originalTransactionId = currentSubInfo?.at(-1)?.originalTransactionId;

        if (!originalTransactionId) return;

        (async () => {
            const result = await sdk.confirm({
                message: t('already_have_subscription', {
                    transactionId: String(originalTransactionId)
                }),
                okButtonTitle: 'choose_another_wallet'
            });

            onCurrentClose();

            if (result) {
                onProAuthOpen();
            }
        })();
    }, [currentSubInfo]);

    useEffect(() => {
        if (!isSuccess) return;

        if (status === IosPurchaseStatuses.CANCELED) {
            toast(t('purchase_canceled'));

            return;
        } else if (status === IosPurchaseStatuses.PENDING) {
            toast(t('purchase_processing'));
        } else {
            toast(t('purchase_success'));
        }

        onCurrentClose();
        navigate(AppRoute.settings + SettingsRoute.pro, { replace: true });
    }, [isSuccess]);

    return { startPurchasing, isLoading: isPurchasing || isSubInfoLoading };
};
