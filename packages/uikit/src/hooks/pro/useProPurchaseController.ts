import { useEffect } from 'react';
import {
    IDisplayPlan,
    isPurchaseError,
    PurchaseErrors,
    PurchaseStatuses
} from '@tonkeeper/core/dist/entries/pro';

import { useTranslation } from '../translation';
import { useNavigate } from '../router/useNavigate';
import { useTargetAuthUpdate } from './useTargetAuthUpdate';
import { AppRoute, SettingsRoute } from '../../libs/routes';
import { useNotifyError, useToast } from '../useNotification';
import { useManageSubscription, useProLogout, useProPurchaseMutation } from '../../state/pro';
import { useProPurchaseNotification } from '../../components/modals/ProPurchaseNotificationControlled';
import { useAtomValue } from '../../libs/useAtom';
import { subscriptionFormTempAuth$ } from '@tonkeeper/core/dist/ProAuthTokenService';
import { SubscriptionSource } from '@tonkeeper/core/dist/pro';

interface IOnPurchaseProps {
    plans: IDisplayPlan[];
    selectedSource: SubscriptionSource;
    selectedPlanId: string;
}

export const useProPurchaseController = () => {
    const { t } = useTranslation();
    const toast = useToast();
    const navigate = useNavigate();
    const { onClose: onCurrentClose } = useProPurchaseNotification();
    const targetAuth = useAtomValue(subscriptionFormTempAuth$);

    useTargetAuthUpdate();

    const {
        data: status,
        mutateAsync: startPurchasing,
        isLoading: isPurchasing,
        isSuccess: isPurchasingSuccess,
        isError: isPurchasingError,
        error: purchaseError,
        reset
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
        } else {
            toast(t(PurchaseErrors.PURCHASE_FAILED));
        }

        reset();
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

    const handlePurchase = async (props: IOnPurchaseProps) => {
        const { plans, selectedSource, selectedPlanId } = props;

        const selectedPlan = plans.find(plan => plan.id === selectedPlanId);

        if (!targetAuth) return;
        if (!selectedPlan) return;

        await startPurchasing({
            source: selectedSource,
            formData: {
                selectedPlan,
                wallet: targetAuth.wallet,
                tempToken: targetAuth.tempToken
            }
        });
    };

    return {
        states: {
            isPurchasing,
            isLoggingOut,
            isManageLoading
        },
        methods: {
            onLogout: handleLogOut,
            onPurchase: handlePurchase,
            onManage: handleManageSubscription
        }
    };
};
