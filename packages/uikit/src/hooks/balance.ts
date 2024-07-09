import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { AmountFormatter } from '@tonkeeper/core/dist/utils/AmountFormatter';
import { formatDecimals, shiftedDecimals } from "@tonkeeper/core/dist/utils/balance";
import { getDecimalSeparator, getGroupSeparator } from '@tonkeeper/core/dist/utils/formatting';
import BigNumber from 'bignumber.js';
import { useCallback, useMemo } from 'react';

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

export const formatFiatCurrency = (currency: FiatCurrencies, balance: BigNumber.Value) => {
    return formatter.format(balance.toString(), {
        currency: currency,
        ignoreZeroTruncate: false,
        decimals: 4
    });
};
