import { useCallback, useMemo } from 'react';
import BigNumber from 'bignumber.js';

import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { AmountFormatter } from '@tonkeeper/core/dist/utils/AmountFormatter';
import { formatDecimals, shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import { getDecimalSeparator, getGroupSeparator } from '@tonkeeper/core/dist/utils/formatting';
import { formatDisplayAmount } from '../libs/formatDisplayAmount';

export const formatter = new AmountFormatter({
    getLocaleFormat: () => ({
        decimalSeparator: getDecimalSeparator(),
        groupingSeparator: getGroupSeparator()
    })
});

export const toFormattedTonBalance = (weiBalance: number) => {
    return formatter.format(shiftedDecimals(weiBalance, 9));
};

export const useCoinFullBalance = (balance: number | string, decimals: string | number = 9) => {
    return useMemo(
        () =>
            formatter.format(formatDecimals(balance, decimals), {
                ignoreZeroTruncate: false,
                decimals
            }),
        [balance, decimals]
    );
};

export const useFormatBalance = (amount: number | string, decimals: string | number = 9) => {
    return useMemo(() => {
        return formatter.format(amount, {
            ignoreZeroTruncate: false,
            decimals
        });
    }, [amount, decimals]);
};

export const useFormatCoinValue = () => {
    return useCallback((amount: number | string | BigNumber, decimals: string | number = 9) => {
        return formatter.format(formatDecimals(amount, decimals), {
            ignoreZeroTruncate: false,
            decimals
        });
    }, []);
};

export const formatFiatCurrencySignificant = (
    currency: FiatCurrencies,
    balance: BigNumber.Value,
    significantDigits = 3
) => {
    return formatDisplayAmount({
        kind: 'fiat',
        amount: balance,
        currency,
        profile: 'significant',
        significantDigits
    });
};

export const formatFiatCurrency = (currency: FiatCurrencies, balance: BigNumber.Value) => {
    return formatDisplayAmount({
        kind: 'fiat',
        amount: balance,
        currency,
        profile: 'default'
    });
};
