import { Body2 } from '../../Text';
import { FC } from 'react';
import { formatter } from '../../../hooks/balance';

export const NumericCell: FC<{ value: string; decimalPlaces?: number }> = ({
    value,
    decimalPlaces
}) => {
    const formatted = formatter.format(value, {
        ignoreZeroTruncate: false,
        decimals: decimalPlaces
    });
    return <Body2>{formatted}</Body2>;
};
