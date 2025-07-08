import { useEffect, useState } from 'react';
import { IosPurchaseStatuses } from '@tonkeeper/core/dist/entries/pro';

import {
    useManageSubscription,
    useProLogout,
    useProPlans,
    useProSubscriptionPurchase
} from '../../state/pro';
import { Label2 } from '../Text';
import { Button } from '../fields/Button';
import { ProLegalNote } from './ProLegalNote';
import { handleSubmit } from '../../libs/form';
import { ProFeaturesList } from './ProFeaturesList';
import { ProActiveWallet } from './ProActiveWallet';
import { SubscriptionScreens } from '../../enums/pro';
import { useTranslation } from '../../hooks/translation';
import { useNavigate } from '../../hooks/router/useNavigate';
import { ProSubscriptionHeader } from './ProSubscriptionHeader';
import { ProScreenContentWrapper } from './ProScreenContentWrapper';
import { useNotifyError, useToast } from '../../hooks/useNotification';
import { ProChooseSubscriptionPlan } from './ProChooseSubscriptionPlan';
import { adaptPlansToViewModel, getSkeletonProducts } from '../../libs/pro';
import { ProSettingsMainButtonWrapper } from './ProSettingsMainButtonWrapper';
import { useGoToSubscriptionScreen } from '../../hooks/pro/useGoToSubscriptionScreen';

export const ProPurchaseChooseScreen = () => {
    const { t } = useTranslation();
    const [selectedPlanId, setSelectedPlanId] = useState('');

    const toast = useToast();
    const navigate = useNavigate();
    const goTo = useGoToSubscriptionScreen();
    const {
        data: purchaseStatus,
        mutateAsync: startPurchasing,
        isSuccess: isPurchaseSuccess,
        isLoading: isPurchasing,
        isError: isPurchaseError
    } = useProSubscriptionPurchase();

    const { mutateAsync: handleManageSubscription, isLoading: isManageLoading } =
        useManageSubscription();

    useEffect(() => {
        if (isPurchaseError) {
            toast(t('purchase_failed'));
        }
    }, [isPurchaseError]);

    const {
        mutateAsync: handleLogOut,
        error: logoutError,
        isLoading: isLoggingOut
    } = useProLogout();
    useNotifyError(logoutError);

    const { data: products, error, isError, isFetching, refetch } = useProPlans();
    useNotifyError(error);

    useEffect(() => {
        if (!isPurchaseSuccess) return;

        if (purchaseStatus === IosPurchaseStatuses.CANCELED) {
            toast(t('purchase_canceled'));

            return;
        }

        if (purchaseStatus === IosPurchaseStatuses.PENDING) {
            toast(t('purchase_processing'));
        } else {
            toast(t('purchase_success'));
        }

        goTo(SubscriptionScreens.STATUS);
    }, [isPurchaseSuccess, toast, t, navigate]);

    const isTotalLoading = isFetching || isPurchasing || isLoggingOut || isManageLoading;

    const handleBuySubscription = async () => {
        if (isError) {
            void refetch();

            return;
        }

        const selectedPlan = displayPlans.find(plan => plan.id === selectedPlanId);

        if (!selectedPlan) {
            toast(t('purchase_failed'));

            return;
        }

        await startPurchasing(selectedPlan);
    };

    const displayPlans = adaptPlansToViewModel(products).filter(
        plan => plan.formattedDisplayPrice !== '-'
    );
    const productsForRender = displayPlans?.length
        ? displayPlans
        : getSkeletonProducts(isCryptoStrategy(sdk.subscriptionStrategy) ? 1 : 2);

    useEffect(() => {
        if (productsForRender?.length < 1) return;

        setSelectedPlanId(productsForRender[0].id);
    }, [productsForRender]);

    return (
        <ProScreenContentWrapper onSubmit={handleSubmit(handleBuySubscription)}>
            <ProSubscriptionHeader
                titleKey="get_tonkeeper_pro"
                subtitleKey="choose_billing_description"
            />
            <ProActiveWallet isLoading={isLoggingOut} onLogout={handleLogOut} />
            <ProChooseSubscriptionPlan
                isLoading={isTotalLoading}
                selectedPlanId={selectedPlanId}
                onPlanIdSelection={setSelectedPlanId}
                productsForRender={productsForRender}
            />
            <ProFeaturesList />
            <ProSettingsMainButtonWrapper>
                <Button primary fullWidth size="large" type="submit" loading={isTotalLoading}>
                    <Label2>{t(isError ? 'try_again' : 'continue_with_tonkeeper_pro')}</Label2>
                </Button>
                <ProLegalNote onManage={handleManageSubscription} />
            </ProSettingsMainButtonWrapper>
        </ProScreenContentWrapper>
    );
};
