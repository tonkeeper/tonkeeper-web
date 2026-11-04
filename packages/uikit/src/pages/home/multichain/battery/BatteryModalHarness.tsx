import { FC } from 'react';
import BigNumber from 'bignumber.js';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';

import type { BatteryBalance } from '../../../../state/battery';
import { BatteryModalView, BatteryRechargeMethodRow } from './BatteryModal';

const noop = () => {};

const IMAGE =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="#7665E5"/></svg>'
    );

export const HARNESS_METHODS: BatteryRechargeMethodRow[] = [
    { key: 'usdt', symbol: 'USD₮', image: IMAGE, assetId: 'ton-usdt' },
    { key: 'ton', symbol: 'GRAM', image: IMAGE, assetId: TON_ASSET.id }
];

/**
 * CT mount wrapper. Playwright serializes mount props across the
 * Node→browser boundary and drops class prototypes, so the `BigNumber` /
 * `AssetAmount` balance is rebuilt here from primitives. `tonBalance`
 * decides the glyph (negative / empty / fill level), `charges` the caption.
 */
export const BatteryModalHarness: FC<{
    tonBalance?: string;
    charges?: number;
    loading?: boolean;
    withPromo?: boolean;
    promoError?: string;
    withGift?: boolean;
    withHistory?: boolean;
    methods?: BatteryRechargeMethodRow[];
    onOpenSettings?: () => void;
    onOpenSupportedTransactions?: () => void;
    onSelectMethod?: (assetId: string) => void;
    onSelectGift?: () => void;
    onSubmitPromo?: () => void;
    onOpenHistory?: () => void;
}> = ({
    tonBalance = '0',
    charges = 0,
    loading,
    withPromo = true,
    promoError,
    withGift = true,
    withHistory = true,
    methods = HARNESS_METHODS,
    onOpenSettings = noop,
    onOpenSupportedTransactions = noop,
    onSelectMethod = noop,
    onSelectGift = noop,
    onSubmitPromo = noop,
    onOpenHistory = noop
}) => {
    const balance: BatteryBalance | undefined = loading
        ? undefined
        : {
              tonUnitsBalance: AssetAmount.fromRelativeAmount({
                  asset: TON_ASSET,
                  amount: new BigNumber(tonBalance)
              }),
              tonUnitsReserved: AssetAmount.fromRelativeAmount({ asset: TON_ASSET, amount: 0 }),
              batteryUnitsBalance: new BigNumber(charges),
              batteryUnitsReserved: new BigNumber(0)
          };

    return (
        <BatteryModalView
            isOpen
            onClose={noop}
            balance={balance}
            promo={
                withPromo
                    ? {
                          value: promoError ? 'KEEPER2026' : '',
                          onChange: noop,
                          onSubmit: onSubmitPromo,
                          error: promoError
                      }
                    : undefined
            }
            onOpenSettings={onOpenSettings}
            onOpenSupportedTransactions={onOpenSupportedTransactions}
            methods={methods}
            onSelectMethod={onSelectMethod}
            onSelectGift={withGift ? onSelectGift : undefined}
            onOpenHistory={withHistory ? onOpenHistory : undefined}
        />
    );
};
