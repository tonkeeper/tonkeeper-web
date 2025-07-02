import { useEffect, useState } from 'react';
import { isProductId } from '@tonkeeper/core/dist/entries/pro';

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
import { useProLogout, useProPlans, useProSubscriptionPurchase } from '../../state/pro';

export const ProPurchaseChooseScreen = () => {
    const { t } = useTranslation();
    const [selectedPlan, setSelectedPlan] = useState('');

    const toast = useToast();
    const navigate = useNavigate();
    const goTo = useGoToSubscriptionScreen();
    const { mutateAsync, isSuccess, isLoading } = useProSubscriptionPurchase();

    const {
        mutateAsync: handleLogOut,
        error: logoutError,
        isLoading: isLoggingOut
    } = useProLogout();
    useNotifyError(logoutError);

    const { data: products, error, isError, isFetching, refetch } = useProPlans();
    useNotifyError(error);

    useEffect(() => {
        if (isSuccess) {
            toast(t('subscription_purchase_success'));
            goTo(SubscriptionScreens.STATUS);
        }
    }, [isSuccess, toast, t, navigate]);

    const isTotalLoading = isFetching || isLoading || isLoggingOut;

    const handleBuySubscription = async () => {
        if (isError) {
            void refetch();

            return;
        }

        if (!selectedPlan || !isProductId(selectedPlan)) {
            toast(t('purchase_failed'));

            return;
        }

        await mutateAsync(selectedPlan);
    };

    const displayPlans = adaptPlansToViewModel(products);
    const productsForRender = displayPlans?.length ? displayPlans : getSkeletonProducts();

    return (
        <ProScreenContentWrapper onSubmit={handleSubmit(handleBuySubscription)}>
            <ProSubscriptionHeader
                titleKey="get_tonkeeper_pro"
                subtitleKey="choose_billing_description"
            />
            <ProActiveWallet isLoading={isLoggingOut} onLogout={handleLogOut} />
            <ProChooseSubscriptionPlan
                isLoading={isTotalLoading}
                selectedPlan={selectedPlan}
                onPlanSelection={setSelectedPlan}
                productsForRender={productsForRender}
            />
            <ProFeaturesList />
            <ProSettingsMainButtonWrapper>
                <Button primary fullWidth size="large" type="submit" loading={isTotalLoading}>
                    <Label2>{t(isError ? 'try_again' : 'continue_with_tonkeeper_pro')}</Label2>
                </Button>
                <ProLegalNote />
            </ProSettingsMainButtonWrapper>
        </ProScreenContentWrapper>
    );
};
