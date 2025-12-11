import { useMemo } from 'react';
import { ProPrice, ProPriceTypes } from '@tonkeeper/core/dist/entries/pro';
import { tonAssetAddressToString } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';

import { useFormatFiat, useRate } from '../../state/rates';

export const useFormattedProPrice = (price: ProPrice | undefined) => {
    const isRaw = price?.type === ProPriceTypes.RAW;
    const tokenAmount = isRaw ? price.value.relativeAmount : undefined;
    const loadRateFor = isRaw ? tonAssetAddressToString(price.value.asset.address) : '';

    const { data: rate } = useRate(loadRateFor);
    const { fiatAmount: fiatEquivalent } = useFormatFiat(rate, tokenAmount);

    return useMemo(() => {
        if (!price) {
            return {};
        }

        const displayPrice = isRaw
            ? price.value.toStringAssetAbsoluteRelativeAmount()
            : price.value;

        return { displayPrice, fiatEquivalent };
    }, [price, rate, fiatEquivalent]);
};
