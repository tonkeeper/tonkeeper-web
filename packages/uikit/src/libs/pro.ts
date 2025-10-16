import { IDisplayPlan, ProPriceTypes } from '@tonkeeper/core/dist/entries/pro';
import { useProCarouselMetaData } from '../components/pro/PromoNotificationCarousel';
import { useMemo } from 'react';

export const getSkeletonProducts = (skeletonSize = 2): IDisplayPlan[] =>
    Array.from({ length: skeletonSize }, (_, index) => ({
        id: String(index),
        displayName: '',
        price: {
            type: ProPriceTypes.FORMATTED,
            value: ''
        },
        subscriptionPeriod: ''
    }));

export const useAllCarouselImages = (baseSlideUrl: string | undefined): string[] => {
    const metaData = useProCarouselMetaData();

    return useMemo(
        () =>
            baseSlideUrl
                ? metaData.flatMap(({ src }) =>
                      Object.values(src).map((path: string) => `${baseSlideUrl}${path}`)
                  )
                : [],
        [baseSlideUrl, metaData]
    );
};
