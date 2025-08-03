import { IDisplayPlan } from '@tonkeeper/core/dist/entries/pro';

export const getSkeletonProducts = (skeletonSize = 2): IDisplayPlan[] =>
    Array.from({ length: skeletonSize }, (_, index) => ({
        id: String(index),
        displayName: '',
        displayPrice: '',
        formattedDisplayPrice: ''
    }));
