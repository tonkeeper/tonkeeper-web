import { SubscriptionSource } from '@tonkeeper/core/dist/pro';
import { IDisplayPlan, NormalizedProPlans } from '@tonkeeper/core/dist/entries/pro';

import { SubscriptionScreens } from '../enums/pro';
import { formatter } from '../hooks/balance';

export const getSkeletonProducts = (skeletonSize = 2): IDisplayPlan[] =>
    Array.from({ length: skeletonSize }, (_, index) => ({
        id: String(index),
        displayName: '',
        displayPrice: '',
        formattedDisplayPrice: ''
    }));

export const isDirectionForward = (
    current: SubscriptionScreens,
    prev: SubscriptionScreens | null
): boolean => {
    if (prev === null) return true;

    return current > prev;
};

export function parsePrice(priceStr: string): number {
    const numeric = priceStr.replace(/[^0-9.,]/g, '').replace(',', '.');

    return parseFloat(numeric);
}

export const isValidNanoString = (value: string): boolean => {
    return /^\d+$/.test(value);
};

export const getFormattedProPrice = (displayPrice: string | null, isCrypto: boolean) => {
    try {
        if (!displayPrice) return '-';

        let formattedProPrice = displayPrice;
        if (isCrypto) {
            formattedProPrice = isValidNanoString(displayPrice)
                ? `${formatter.fromNano(displayPrice)} TON`
                : '-';
        }

        return formattedProPrice;
    } catch (e) {
        console.error('getFormattedDisplayPrice error: ', e);
        return '-';
    }
};

export function adaptPlansToViewModel(
    normalizedPlans: NormalizedProPlans | undefined
): IDisplayPlan[] {
    if (!normalizedPlans) return [];

    switch (normalizedPlans.source) {
        case SubscriptionSource.IOS:
            return normalizedPlans.plans.map(plan => ({
                id: plan.id,
                displayName: plan.displayName,
                displayPrice: plan.displayPrice,
                formattedDisplayPrice: getFormattedProPrice(plan.displayPrice, false)
            }));

        case SubscriptionSource.CRYPTO:
            return normalizedPlans.plans.map(plan => ({
                id: String(plan.id),
                displayName: plan.name,
                displayPrice: plan.amount,
                formattedDisplayPrice: getFormattedProPrice(plan.amount, true)
            }));
    }
}
