import {
    IDisplayPlan,
    isCryptoProPlans,
    isCryptoStrategy,
    NormalizedProPlans
} from '@tonkeeper/core/dist/entries/pro';

import { adaptPlansToViewModel, getSkeletonProducts } from '../../libs/pro';
import { useAppSdk } from '../appSdk';
import { useTranslation } from '../translation';
import { useEffect, useState } from 'react';
import { useProPlans } from '../../state/pro';
import { useNotifyError } from '../useNotification';

const CRYPTO_SKELETON_PRODUCTS_QTY = 1;
const IOS_SKELETON_PRODUCTS_QTY = 2;

export const getFilteredDisplayPlans = (proPlans: NormalizedProPlans | undefined) => {
    return adaptPlansToViewModel(proPlans).filter(plan => plan.formattedDisplayPrice !== '-');
};

export const getProductsForRender = (displayPlans: IDisplayPlan[], isCrypto: boolean) => {
    return displayPlans.length
        ? displayPlans
        : getSkeletonProducts(isCrypto ? CRYPTO_SKELETON_PRODUCTS_QTY : IOS_SKELETON_PRODUCTS_QTY);
};

export const useProductSelection = () => {
    const sdk = useAppSdk();
    const { t } = useTranslation();

    const [promoCode, setPromoCode] = useState('');
    const [selectedPlanId, setSelectedPlanId] = useState('');

    const { data: proPlans, isLoading, isError } = useProPlans(promoCode);
    useNotifyError(isError && new Error(t('failed_subscriptions_loading')));

    const isCrypto = isCryptoStrategy(sdk.subscriptionStrategy);
    const isCryptoPlans = isCryptoProPlans(proPlans);

    const verifiedPromoCode = isCryptoPlans ? proPlans.promoCode : undefined;
    const displayPlans = getFilteredDisplayPlans(proPlans);
    const productsForRender = getProductsForRender(displayPlans, isCrypto);

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
        plans: displayPlans,
        productsForRender,
        selectedPlanId,
        promoCode,
        setPromoCode,
        verifiedPromoCode,
        setSelectedPlanId,
        isLoading
    };
};
