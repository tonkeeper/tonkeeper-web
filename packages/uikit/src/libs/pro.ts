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
