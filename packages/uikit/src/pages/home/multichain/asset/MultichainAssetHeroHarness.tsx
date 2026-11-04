import { FC } from 'react';
import BigNumber from 'bignumber.js';

import type { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';

import { ChartPeriodChange, ChartScrubPoint } from '../../../../state/trading/useAssetCharts';
import { MultichainAssetHero } from './MultichainAssetHero';

export type HeroAsset = Omit<MultichainWalletAsset, 'price'> & { priceStr?: string };

// Playwright CT serializes mount props across the Node→browser boundary, which
// drops class prototypes — a `BigNumber` arrives as a plain object and the
// formatter then reads it as `NaN` and renders "0". Reconstruct the price here,
// where the body runs in the browser, so the component gets a real `BigNumber`.
export const HeroHarness: FC<{
    asset: HeroAsset;
    scrub?: ChartScrubPoint;
    periodChange?: ChartPeriodChange;
    periodChangeLoading?: boolean;
}> = ({ asset, scrub, periodChange, periodChangeLoading }) => {
    const { priceStr, ...rest } = asset;
    return (
        <MultichainAssetHero
            asset={{ ...rest, price: priceStr ? new BigNumber(priceStr) : undefined }}
            scrub={scrub}
            periodChange={periodChange}
            periodChangeLoading={periodChangeLoading}
        />
    );
};
