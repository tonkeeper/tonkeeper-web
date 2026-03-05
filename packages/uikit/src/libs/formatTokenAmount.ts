import BigNumber from 'bignumber.js';
import { formatDisplayAmount } from './formatDisplayAmount';

export interface FormatTokenAmountOptions {
    decimalSeparator?: string;
    groupSeparator?: string;
    withUnit?: boolean;
}

export const formatTokenAmount = (
    amount: BigNumber.Value,
    unit: string,
    options: FormatTokenAmountOptions = {}
) => {
    return formatDisplayAmount({
        kind: 'token',
        amount,
        unit,
        withUnit: options.withUnit,
        groupSeparator: options.groupSeparator,
        decimalSeparator: options.decimalSeparator
    });
};
