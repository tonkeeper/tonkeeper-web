import { useCallback, useMemo } from 'react';
import BigNumber from 'bignumber.js';

import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { formatDecimals, shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import { amountFormatter, formatAmount } from '@tonkeeper/core/dist/utils/numberFormat';

export const formatter = amountFormatter;

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
    return formatAmount(balance, { currency });
};

export const formatTokenDisplay = (amount: BigNumber.Value, unit: string) => {
    return formatAmount(amount, { unit });
};
