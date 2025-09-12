import {
    isCryptoStrategy,
    isPurchaseError,
    PurchaseErrors,
    PurchaseStatuses
} from '@tonkeeper/core/dist/entries/pro';
import { subscriptionFormTempAuth$ } from '@tonkeeper/core/dist/ProAuthTokenService';

import { useAppSdk } from '../appSdk';
import { useTranslation } from '../translation';
import { useManageSubscription, useProLogout, useProPurchaseMutation } from '../../state/pro';
import { useNotifyError, useToast } from '../useNotification';
import { useProductSelection } from './useProductSelection';
import { useEffect } from 'react';
import { AppRoute, SettingsRoute } from '../../libs/routes';
import { useProPurchaseNotification } from '../../components/modals/ProPurchaseNotificationControlled';
import { useNavigate } from '../router/useNavigate';
import { useExistingIosSubscription } from './useExistingIosSubscription';
import { useAtomValue } from '../../libs/useAtom';

export const useProPurchaseController = () => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const toast = useToast();
    const navigate = useNavigate();
    const targetAuth = useAtomValue(subscriptionFormTempAuth$);
    const { onClose: onCurrentClose } = useProPurchaseNotification();
    const isCrypto = isCryptoStrategy(sdk.subscriptionStrategy);

    useExistingIosSubscription();

    const {
        plans,
        productsForRender,
        selectedPlanId,
        setSelectedPlanId,
        isLoading: isPlansLoading,
        promoCode,
        setPromoCode,
        verifiedPromoCode
    } = useProductSelection();

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
    useManageSubscription();
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

    const isLoading = isPlansLoading || isPurchasing || isLoggingOut || isManageLoading;

    const onSubmit = async () => {
        const selectedPlan = plans.find(plan => plan.id === selectedPlanId);

        if (!targetAuth) return;
        if (!selectedPlan) return;

        await startPurchasing({
            selectedPlan,
            wallet: targetAuth.wallet,
            tempToken: targetAuth.tempToken,
            promoCode: verifiedPromoCode
        });
    };

    return {
        states: {
            isCrypto,
            isLoading,
            isLoggingOut,
            promoCode,
            productsForRender,
            verifiedPromoCode
        },
        methods: {
            onSubmit,
            setPromoCode,
            selectedPlanId,
            setSelectedPlanId,
            onLogout: handleLogOut,
            onManage: handleManageSubscription
        }
    };
};
