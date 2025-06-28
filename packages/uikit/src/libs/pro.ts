export const getSkeletonProducts = (skeletonSize = 2) =>
    Array.from({ length: skeletonSize }, (_, index) => ({
        id: index,
        displayName: null,
        displayPrice: null
    }));
