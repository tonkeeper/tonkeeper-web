import { Body2 } from '../../Text';
import { FC } from 'react';
import BigNumber from 'bignumber.js';
import { useFormatCoinValue } from '../../../hooks/balance';

export const NumericCryptoCell: FC<{ value: BigNumber; decimals: number; symbol: string }> = ({
    value,
    decimals,
    symbol
}) => {
    const format = useFormatCoinValue();

    const formatted = format(value, decimals);

    return (
        <Body2>
            {formatted}&nbsp;{symbol}
        </Body2>
    );
};
