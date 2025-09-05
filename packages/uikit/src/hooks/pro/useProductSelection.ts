import { IDisplayPlan } from '@tonkeeper/core/dist/entries/pro';

import { getSkeletonProducts } from '../../libs/pro';
import { useTranslation } from '../translation';
import { useEffect, useState } from 'react';
import { useProPlans } from '../../state/pro';
import { useNotifyError } from '../useNotification';
import { SubscriptionSource } from '@tonkeeper/core/dist/pro';

const SKELETON_PRODUCTS_QTY = 1;

export const getProductsForRender = (displayPlans: IDisplayPlan[]) => {
    return displayPlans.length ? displayPlans : getSkeletonProducts(SKELETON_PRODUCTS_QTY);
};

export const useProductSelection = () => {
    const { t } = useTranslation();

    const [selectedSource, setSelectedSource] = useState<SubscriptionSource>(
        SubscriptionSource.EXTENSION
    );
    const [selectedPlanId, setSelectedPlanId] = useState('');

    const { data: plans, isLoading, isError } = useProPlans(selectedSource);
    useNotifyError(isError && new Error(t('failed_subscriptions_loading')));

    const productsForRender = getProductsForRender(plans);

    useEffect(() => {
        if (productsForRender.length < 1 || !productsForRender[0].displayPrice) {
            setSelectedPlanId('');

            return;
        }

        if (!selectedPlanId) {
            setSelectedPlanId(productsForRender[0].id);
        }
    }, [productsForRender]);

    return {
        plans,
        productsForRender,
        selectedSource,
        selectedPlanId,
        onSourceSelect: setSelectedSource,
        onPlanIdSelect: setSelectedPlanId,
        isSelectionLoading: isLoading
    };
};
