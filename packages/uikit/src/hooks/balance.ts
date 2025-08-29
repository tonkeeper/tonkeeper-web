import { useCallback, useMemo } from 'react';
import BigNumber from 'bignumber.js';

import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { isValidNanoString } from '@tonkeeper/core/dist/utils/pro';
import { AmountFormatter } from '@tonkeeper/core/dist/utils/AmountFormatter';
import { formatDecimals, shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import { getDecimalSeparator, getGroupSeparator } from '@tonkeeper/core/dist/utils/formatting';

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

interface IFiatEquivalentProps {
    amount: string | null;
    fiat: FiatCurrencies;
    ratePrice: number | undefined;
}

export const getFiatEquivalent = ({ amount, ratePrice, fiat }: IFiatEquivalentProps) => {
    if (!ratePrice || !fiat) return '';
    if (!amount || !isValidNanoString(amount)) return '';

    try {
        const bigPrice = new BigNumber(ratePrice);
        const bigAmount = new BigNumber(formatter.fromNano(amount));

        if (bigPrice.isNaN() || bigAmount.isNaN()) return '';

        const inFiat = formatter.format(bigPrice.multipliedBy(bigAmount));

        return `${inFiat} ${fiat}`;
    } catch (e) {
        console.error('FiatEquivalent error: ', e);

        return '';
    }
};
