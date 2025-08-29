import { IDisplayPlan } from '@tonkeeper/core/dist/entries/pro';
import { META_DATA_MAP } from '../components/pro/PromoNotificationCarousel';

export const getSkeletonProducts = (skeletonSize = 2): IDisplayPlan[] =>
    Array.from({ length: skeletonSize }, (_, index) => ({
        id: String(index),
        displayName: '',
        displayPrice: '',
        subscriptionPeriod: '',
        formattedDisplayPrice: ''
    }));

export const getAllCarouselImages = (baseSlideUrl?: string): string[] => {
    if (!baseSlideUrl) return [];

    return META_DATA_MAP.flatMap(({ src }) =>
        Object.values(src).map((path: string) => `${baseSlideUrl}${path}`)
    );
};
