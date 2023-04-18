import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { AmountFormatter } from '@tonkeeper/core/dist/utils/AmountFormatter';
import { formatDecimals } from '@tonkeeper/core/dist/utils/balance';
import {
  getBrowserLocale,
  getCoinFullBalance,
  getDecimalSeparator,
  getGroupSeparator,
} from '@tonkeeper/core/dist/utils/formatting';
import BigNumber from 'bignumber.js';
import { useCallback, useMemo } from 'react';

export const useCoinFullBalance = (
  balance: number | string,
  decimals: number = 9
) => {
  return useMemo(
    () => getCoinFullBalance(balance, decimals),
    [balance, decimals]
  );
};

export const useFormatCoinValue = () => {
  const formats = useMemo(
    () => [
      new Intl.NumberFormat(getBrowserLocale(), {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }),
      new Intl.NumberFormat(getBrowserLocale(), {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4,
      }),
    ],
    []
  );

  return useCallback(
    (amount: number | string, decimals: number = 9) => {
      if (amount == 0) return '0';

      const value = formatDecimals(amount, decimals);
      const [common, secondary] = formats;
      let formatted = common.format(value);
      if (formatted != '0' && formatted != '0.01') {
        return formatted;
      }

      formatted = secondary.format(value);
      if (formatted != '0') {
        return formatted;
      }

      const formatFull = new Intl.NumberFormat(getBrowserLocale(), {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
      });
      return formatFull.format(value);
    },
    [formats]
  );
};

const formatter = new AmountFormatter({
  getLocaleFormat: () => ({
    decimalSeparator: getDecimalSeparator(),
    groupingSeparator: getGroupSeparator(),
  }),
});

export const formatFiatCurrency = (
  currency: FiatCurrencies,
  balance: BigNumber.Value
) => {
  return formatter.format(balance.toString(), {
    currency: currency,
    ignoreZeroTruncate: false,
    decimals: 4,
  });
};
