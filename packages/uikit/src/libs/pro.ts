import {
    IDisplayPlan,
    NormalizedProPlans,
    ProductIds,
    SubscriptionSources
} from '@tonkeeper/core/dist/entries/pro';

import { SubscriptionScreens } from '../enums/pro';

export const getSkeletonProducts = (skeletonSize = 2) =>
    Array.from({ length: skeletonSize }, (_, index) => ({
        id: index,
        displayName: null,
        displayPrice: null
    }));

export const isDirectionForward = (
    current: SubscriptionScreens,
    prev: SubscriptionScreens | null
): boolean => {
    if (prev === null) return true;

    return current > prev;
};

export function adaptPlansToViewModel(
    normalizedPlans: NormalizedProPlans | undefined
): IDisplayPlan[] {
    if (!normalizedPlans) return [];

    switch (normalizedPlans.source) {
        case SubscriptionSources.IOS:
            return normalizedPlans.plans.map(plan => ({
                id: plan.id,
                displayName: plan.displayName,
                displayPrice: plan.displayPrice
            }));

        case SubscriptionSources.CRYPTO:
            return [
                // TODO Remove this side effect, it's temporal
                { displayName: '1_month', displayPrice: '-', id: `crypto-${ProductIds.MONTHLY}` },
                ...normalizedPlans.plans.map(plan => ({
                    id: plan.id.toString(),
                    displayName: plan.name,
                    displayPrice: plan.amount
                }))
            ];
    }
}
