import { FC } from 'react';
import BigNumber from 'bignumber.js';

import type { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';

import { MultichainAssetBalanceCard } from './MultichainAssetBalanceCard';

export type BalanceCardAsset = Omit<MultichainWalletAsset, 'price'> & { priceStr?: string };

// Playwright CT serializes mount props across the Node→browser boundary, which
// drops class prototypes — a `BigNumber` arrives as a plain object and method
// calls like `human.multipliedBy(...)` throw. This wrapper takes plain string
// props and reconstructs the `BigNumber`s here, where the body runs in the
// browser, so the component receives real `BigNumber` instances.
export const BalanceCardHarness: FC<{ humanStr: string; asset: BalanceCardAsset }> = ({
    humanStr,
    asset
}) => {
    const { priceStr, ...rest } = asset;
    return (
        <div className="w-[390px] bg-backgroundPage">
            <MultichainAssetBalanceCard
                asset={{ ...rest, price: priceStr ? new BigNumber(priceStr) : undefined }}
                human={new BigNumber(humanStr)}
            />
        </div>
    );
};
