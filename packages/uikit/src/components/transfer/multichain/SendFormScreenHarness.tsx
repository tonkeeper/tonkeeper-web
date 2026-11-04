import { FC } from 'react';
import BigNumber from 'bignumber.js';

import type { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';

import { SendFormScreen, SendFormScreenProps } from './SendFormScreen';

export type SendFormHarnessAsset = Omit<MultichainWalletAsset, 'price'> & { priceStr?: string };

// Playwright CT serializes mount props across the Node→browser boundary, which
// drops class prototypes — a `BigNumber` arrives as a plain object and the
// amount field's fiat toggle (`price.lte(...)`) then throws. Reconstruct the
// price here, where the body runs in the browser, so the component gets a real
// `BigNumber`.
export const SendFormScreenHarness: FC<
    Omit<SendFormScreenProps, 'asset'> & { asset: SendFormHarnessAsset }
> = ({ asset, ...rest }) => {
    const { priceStr, ...restAsset } = asset;
    return (
        <SendFormScreen
            asset={{ ...restAsset, price: priceStr ? new BigNumber(priceStr) : undefined }}
            {...rest}
        />
    );
};
