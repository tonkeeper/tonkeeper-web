import { FC } from 'react';
import BigNumber from 'bignumber.js';

import type { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';

import { ManageCryptoRow } from './ManageCryptoRow';

export type ManageRowAsset = Omit<MultichainWalletAsset, 'price'> & { priceStr?: string };

// Playwright CT serializes mount props across the Node→browser boundary, which
// drops class prototypes — a `BigNumber` arrives as a plain object, so the fiat
// segment of the subtitle would otherwise render "0". Reconstruct the price
// here, where the body runs in the browser, so the component gets a real
// `BigNumber`.
export const ManageRowHarness: FC<{
    asset: ManageRowAsset;
    visible: boolean;
    onToggle: () => void;
}> = ({ asset, visible, onToggle }) => {
    const { priceStr, ...rest } = asset;
    return (
        <ManageCryptoRow
            asset={{ ...rest, price: priceStr ? new BigNumber(priceStr) : undefined }}
            visible={visible}
            onToggle={onToggle}
        />
    );
};
