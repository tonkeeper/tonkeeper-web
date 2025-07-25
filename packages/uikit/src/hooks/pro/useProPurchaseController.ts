import { isCryptoStrategy } from '@tonkeeper/core/dist/entries/pro';

import { useAppSdk } from '../appSdk';
import { useTranslation } from '../translation';
import { useManageSubscription, useProLogout } from '../../state/pro';
import { useNotifyError } from '../useNotification';
import { useCryptoPurchaseFlow } from './useCryptoPurchaseFlow';
import { useIosPurchaseFlow } from './useIosPurchaseFlow';
import { useProductSelection } from './useProductSelection';

// TODO Make it in react-query way through useMutation when we get rid of web mobile
export const useProPurchaseController = () => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const isCrypto = isCryptoStrategy(sdk.subscriptionStrategy);

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

    const { startPurchasing: startIosPurchase, isLoading: isIosLoading } = useIosPurchaseFlow();

    const {
        startPurchasing: startCryptoPurchase,
        waitInvoice,
        confirm,
        onConfirmClose,
        isLoading: isCryptoLoading
    } = useCryptoPurchaseFlow();

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

    const isLoading =
        isPlansLoading || isIosLoading || isCryptoLoading || isLoggingOut || isManageLoading;

    const onSubmit = async () => {
        const selectedPlan = plans.find(plan => plan.id === selectedPlanId);

        if (!selectedPlan) return;

        if (isCrypto) {
            await startCryptoPurchase(selectedPlan, verifiedPromoCode);
        } else {
            await startIosPurchase(selectedPlan);
        }
    };

    return {
        common: {
            onSubmit,
            onLogout: handleLogOut,
            isCrypto,
            isLoading,
            selectedPlanId,
            setSelectedPlanId,
            productsForRender
        },
        cryptoFlow: {
            promoCode,
            setPromoCode,
            verifiedPromoCode,
            waitInvoice,
            confirmState: confirm,
            onConfirmClose
        },
        iosFlow: {
            onManage: handleManageSubscription
        }
    };
};
