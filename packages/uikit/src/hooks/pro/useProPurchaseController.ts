import { useEffect } from 'react';
import {
    isPurchaseError,
    PurchaseErrors,
    PurchaseStatuses
} from '@tonkeeper/core/dist/entries/pro';

import { useTranslation } from '../translation';
import { useNavigate } from '../router/useNavigate';
import { useTargetAuthUpdate } from './useTargetAuthUpdate';
import { AppRoute, SettingsRoute } from '../../libs/routes';
import { useNotifyError, useToast } from '../useNotification';
import { useExistingIosSubscription } from './useExistingIosSubscription';
import { useManageSubscription, useProLogout, useProPurchaseMutation } from '../../state/pro';
import { useProPurchaseNotification } from '../../components/modals/ProPurchaseNotificationControlled';

export const useProPurchaseController = () => {
    const { t } = useTranslation();
    const toast = useToast();
    const navigate = useNavigate();
    const { onClose: onCurrentClose } = useProPurchaseNotification();

    useTargetAuthUpdate();
    useExistingIosSubscription();

    const {
        data: status,
        mutateAsync: startPurchasing,
        isLoading: isPurchasing,
        isSuccess: isPurchasingSuccess,
        isError: isPurchasingError,
        error: purchaseError
    } = useProPurchaseMutation();

    const {
        mutateAsync: handleLogOut,
        isLoading: isLoggingOut,
        isError: isLogoutError
    } = useProLogout();
    useNotifyError(isLogoutError && new Error(t('logout_failed')));

    const {
        mutateAsync: handleManageSubscription,
        isLoading: isManageLoading,
        isError: isManageError
    } = useManageSubscription();
    useNotifyError(isManageError && new Error(t('manage_unavailable')));

    useEffect(() => {
        if (!isPurchasingError) return;

        const errorMessage = purchaseError?.message;

        if (isPurchaseError(errorMessage)) {
            toast(t(errorMessage));

            return;
        }

        toast(t(PurchaseErrors.PURCHASE_FAILED));
    }, [isPurchasingError]);

    useEffect(() => {
        if (!isPurchasingSuccess) return;

        if (status === PurchaseStatuses.CANCELED) {
            toast(t('purchase_canceled'));

            return;
        }

        if (status === PurchaseStatuses.PENDING) {
            toast(t('purchase_processing'));
        }

        if (status === PurchaseStatuses.SUCCESS) {
            toast(t('purchase_success'));
        }

        onCurrentClose();
        navigate(AppRoute.settings + SettingsRoute.pro, { replace: true });
    }, [isPurchasingSuccess]);

    return {
        states: {
            isPurchasing,
            isLoggingOut,
            isManageLoading
        },
        methods: {
            onLogout: handleLogOut,
            onPurchase: startPurchasing,
            onManage: handleManageSubscription
        }
    };
};
