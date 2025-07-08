import { IDisplayPlan, NormalizedProPlans } from '@tonkeeper/core/dist/entries/pro';

import { SubscriptionScreens } from '../enums/pro';
import { SubscriptionSource } from '@tonkeeper/core/dist/pro';

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

function isValidNanoString(value: string): boolean {
    return /^\d+$/.test(value);
}

export function parsePrice(priceStr: string): number {
    const numeric = priceStr.replace(/[^0-9.,]/g, '').replace(',', '.');

    return parseFloat(numeric);
}

export function adaptPlansToViewModel(
    normalizedPlans: NormalizedProPlans | undefined
): IDisplayPlan[] {
    if (!normalizedPlans) return [];

    switch (normalizedPlans.source) {
        case SubscriptionSource.IOS:
            return normalizedPlans.plans.map(plan => ({
                id: plan.id,
                displayName: plan.displayName,
                displayPrice: plan.displayPrice
            }));

        case SubscriptionSource.CRYPTO:
            return normalizedPlans.plans.map(plan => ({
                id: String(plan.id),
                displayName: plan.name,
                displayPrice: isValidNanoString(plan.amount) ? plan.amount : '-'
            }));
    }
}
