import { useEffect } from 'react';
import { IosPurchaseStatuses } from '@tonkeeper/core/dist/entries/pro';

import { usePurchaseControlScreen } from './usePurchaseControlScreen';
import { useNotifyError, useToast } from '../useNotification';
import { useTranslation } from '../translation';
import { useNavigate } from '../router/useNavigate';
import { useProSubscriptionPurchase } from '../../state/pro';
import { AppRoute, SettingsRoute } from '../../libs/routes';

export const useIosPurchaseFlow = () => {
    const toast = useToast();
    const { t } = useTranslation();
    const { onClose } = usePurchaseControlScreen();
    const navigate = useNavigate();

    const {
        data: status,
        mutateAsync: startPurchasing,
        isSuccess,
        isLoading,
        isError
    } = useProSubscriptionPurchase();
    useNotifyError(isError && new Error(t('purchase_failed')));

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

        onClose();
        navigate(AppRoute.settings + SettingsRoute.pro, { replace: true });
    }, [isSuccess]);

    return { startPurchasing, isLoading };
};
