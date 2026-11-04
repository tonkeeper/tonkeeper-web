import { FC } from 'react';
import BigNumber from 'bignumber.js';

import type { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';

import { HomeMultichainAssetRow } from './HomeMultichainAssetRow';

export type AssetRowAsset = Omit<MultichainWalletAsset, 'price'> & { priceStr?: string };

// Playwright CT serializes mount props across the Node→browser boundary, which
// drops class prototypes — a `BigNumber` arrives as a plain object, so the fiat
// lines derived from `price` would otherwise render "0". Reconstruct the price
// here, where the body runs in the browser, so the component gets a real
// `BigNumber`.
export const AssetRowHarness: FC<{ asset: AssetRowAsset }> = ({ asset }) => {
    const { priceStr, ...rest } = asset;
    return (
        <HomeMultichainAssetRow
            asset={{ ...rest, price: priceStr ? new BigNumber(priceStr) : undefined }}
        />
    );
};
