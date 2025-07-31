import { IDisplayPlan } from '@tonkeeper/core/dist/entries/pro';

import { formatter } from '../hooks/balance';

export const getSkeletonProducts = (skeletonSize = 2): IDisplayPlan[] =>
    Array.from({ length: skeletonSize }, (_, index) => ({
        id: String(index),
        displayName: '',
        displayPrice: '',
        formattedDisplayPrice: ''
    }));

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

        if (isCrypto) {
            return isValidNanoString(displayPrice)
                ? `${formatter.fromNano(displayPrice)} TON`
                : '-';
        }

        return displayPrice;
    } catch (e) {
        console.error('getFormattedDisplayPrice error: ', e);
        return '-';
    }
};
