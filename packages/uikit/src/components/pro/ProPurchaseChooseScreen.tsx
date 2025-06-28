import { type FC, useEffect, useState } from 'react';
import { IProductInfo, isProductId, ProductIds } from '@tonkeeper/core/dist/entries/pro';

import { Label2 } from '../Text';
import { Button } from '../fields/Button';
import { ProLegalNote } from './ProLegalNote';
import { ProFeaturesList } from './ProFeaturesList';
import { ProActiveWallet } from './ProActiveWallet';
import { getSkeletonProducts } from '../../libs/pro';
import { SubscriptionScreens } from '../../enums/pro';
import { useToast } from '../../hooks/useNotification';
import { useTranslation } from '../../hooks/translation';
import { useProSubscriptionPurchase } from '../../state/pro';
import { useNavigate } from '../../hooks/router/useNavigate';
import { ProSubscriptionHeader } from './ProSubscriptionHeader';
import { ProScreenContentWrapper } from './ProScreenContentWrapper';
import { ProChooseSubscriptionPlan } from './ProChooseSubscriptionPlan';
import { ProSettingsMainButtonWrapper } from './ProSettingsMainButtonWrapper';
import { useGetAllProductsInfo } from '../../hooks/pro/useGetAllProductsInfo';
import { useGoToSubscriptionScreen } from '../../hooks/pro/useGoToSubscriptionScreen';

export const ProPurchaseChooseScreen = () => {
    const products = useGetAllProductsInfo();

    // TODO Implement different strategies
    return <IosSubscriptionScreen products={products} />;
};

interface IIosSubscriptionScreenProps {
    products: IProductInfo[];
}

const IosSubscriptionScreen: FC<IIosSubscriptionScreenProps> = ({ products }) => {
    const { t } = useTranslation();
    const { mutateAsync, isSuccess, isLoading } = useProSubscriptionPurchase();
    const [selectedPlan, setSelectedPlan] = useState(ProductIds.MONTHLY);
    const navigate = useNavigate();
    const toast = useToast();
    const goTo = useGoToSubscriptionScreen();

    useEffect(() => {
        if (isSuccess) {
            toast(t('subscription_purchase_success'));
            goTo(SubscriptionScreens.STATUS);
        }
    }, [isSuccess, toast, t, navigate]);

    const handleBuySubscription = async () => {
        if (!selectedPlan || !isProductId(selectedPlan)) {
            toast(t('purchase_failed'));
            return;
        }

        await mutateAsync(selectedPlan);
    };

    const productsForRender = products?.length ? products : getSkeletonProducts();

    return (
        <ProScreenContentWrapper>
            <ProSubscriptionHeader
                titleKey="get_tonkeeper_pro"
                subtitleKey="choose_billing_description"
            />
            <ProActiveWallet />
            <ProChooseSubscriptionPlan
                isLoading={isLoading}
                selectedPlan={selectedPlan}
                onPlanSelection={setSelectedPlan}
                productsForRender={productsForRender}
            />
            <ProFeaturesList />
            <ProSettingsMainButtonWrapper>
                <Button
                    primary
                    fullWidth
                    size="large"
                    onClick={handleBuySubscription}
                    loading={products?.length < 1 || isLoading}
                >
                    <Label2>{t('continue_with_tonkeeper_pro')}</Label2>
                </Button>
                <ProLegalNote />
            </ProSettingsMainButtonWrapper>
        </ProScreenContentWrapper>
    );
};
