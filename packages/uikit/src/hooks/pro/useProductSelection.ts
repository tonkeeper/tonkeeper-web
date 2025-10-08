import { useEffect, useMemo, useState } from 'react';
import { SubscriptionSource } from '@tonkeeper/core/dist/pro';
import { IDisplayPlan } from '@tonkeeper/core/dist/entries/pro';

import { useProPlans } from '../../state/pro';
import { useTranslation } from '../translation';
import { useNotifyError } from '../useNotification';
import { getSkeletonProducts } from '../../libs/pro';

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

    const productsForRender = useMemo(() => getProductsForRender(plans), [plans]);

    useEffect(() => {
        setSelectedPlanId(productsForRender[0].id);
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
