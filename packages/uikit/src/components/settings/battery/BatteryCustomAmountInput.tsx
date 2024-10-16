import {
    useBatteryShouldBeReservedAmount,
    usePurchaseBatteryUnitTokenRate
} from '../../../state/battery';
import { legacyTonAssetId, TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { FC, useMemo } from 'react';
import BigNumber from 'bignumber.js';
import { AmountDoubleInput } from '../../fields/AmountDoubleInput';

export const BatteryCustomAmountInput: FC<{ asset: TonAsset }> = ({ asset }) => {
    const unitToTokenRate = usePurchaseBatteryUnitTokenRate(legacyTonAssetId(asset));
    const shouldReserveAmount = useBatteryShouldBeReservedAmount();

    const currencies = useMemo(
        () => [
            {
                id: 'token',
                label: asset.symbol,
                decimals: asset.decimals
            },
            {
                id: 'charge_unit',
                label: 'EMOJI',
                decimals: 2
            }
        ],
        [asset.symbol, asset.decimals]
    );

    if (!unitToTokenRate || !shouldReserveAmount) {
        return null;
    }

    const rateFunction = ({ currencyId, value }: { currencyId: string; value: BigNumber }) => {
        if (currencyId === 'token') {
            const willGetBatteryUnits = value
                .div(unitToTokenRate)
                .minus(shouldReserveAmount.batteryUnits);
            return willGetBatteryUnits.lt(0) ? new BigNumber(0) : willGetBatteryUnits;
        }

        return value.plus(shouldReserveAmount.batteryUnits).multipliedBy(unitToTokenRate);
    };

    return <AmountDoubleInput currencies={currencies} rate={rateFunction} />;
};
