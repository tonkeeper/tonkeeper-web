import {
  FiatCurrencies,
  FiatCurrencySymbolsConfig,
} from '@tonkeeper/core/dist/entries/fiat';
import { formatDecimals } from '@tonkeeper/core/dist/utils/balance';
import BigNumber from 'bignumber.js';
import { useCallback, useMemo } from 'react';
import { useAppContext } from './appContext';

export const useCoinFullBalance = (
  currency: FiatCurrencies,
  balance: number | string,
  decimals: number = 9
) => {
  return useMemo(() => {
    if (!balance) return '0';

    const config = FiatCurrencySymbolsConfig[currency];
    const balanceFormat = new Intl.NumberFormat(config.numberFormat, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    });

    return balanceFormat.format(formatDecimals(balance, decimals));
  }, [currency, balance, decimals]);
};

export const useFormatCoinValue = () => {
  const { fiat } = useAppContext();

  const formats = useMemo(
    () => [
      new Intl.NumberFormat(FiatCurrencySymbolsConfig[fiat].numberFormat, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }),
      new Intl.NumberFormat(FiatCurrencySymbolsConfig[fiat].numberFormat, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4,
      }),
    ],
    [fiat]
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

      const formatFull = new Intl.NumberFormat(
        FiatCurrencySymbolsConfig[fiat].numberFormat,
        {
          minimumFractionDigits: 0,
          maximumFractionDigits: decimals,
        }
      );
      return formatFull.format(value);
    },
    [fiat, formats]
  );
};

const toFiatCurrencyFormat = (
  currency: FiatCurrencies,
  maximumFractionDigits?: number
) => {
  const config = FiatCurrencySymbolsConfig[currency];
  return new Intl.NumberFormat(config.numberFormat, {
    minimumFractionDigits: 0,
    maximumFractionDigits:
      maximumFractionDigits ?? config.maximumFractionDigits,
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol',
  });
};

export const formatFiatCurrency = (
  currency: FiatCurrencies,
  balance: BigNumber.Value
) => {
  const amount = new BigNumber(balance).toNumber();
  const balanceFormat = toFiatCurrencyFormat(currency);
  const result = balanceFormat.format(amount);
  if (result.match(/[1-9]/)) {
    return result;
  }
  const balanceExtraFormat = toFiatCurrencyFormat(currency, 4);
  return balanceExtraFormat.format(new BigNumber(balance).toNumber());
};
