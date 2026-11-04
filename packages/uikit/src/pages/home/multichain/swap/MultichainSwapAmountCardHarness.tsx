import { FC, useState } from 'react';

import type { CrossSwapAsset } from '@tonkeeper/core/dist/swapsApi';

import { MultichainSwapAmountCard } from './MultichainSwapFlow';

/**
 * CT mount wrapper: the card is controlled, and Playwright's static
 * mount-loader can't resolve component wrappers defined inside the test
 * file itself.
 */
export const MultichainSwapAmountCardHarness: FC<{ asset: CrossSwapAsset }> = ({ asset }) => {
    const [amount, setAmount] = useState('');
    return (
        <MultichainSwapAmountCard
            label="You send"
            asset={asset}
            amount={amount}
            onAmount={setAmount}
            onAsset={() => {}}
        />
    );
};
