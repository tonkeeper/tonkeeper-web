import { formatDecimals } from './balance';

const defaultFormat = 'en-US';
const defaultDecimalsSeparator = '.';
const defaultGroupSeparator = ',';

export function getBrowserLocale() {
  const browserLocales =
    navigator.languages === undefined
      ? [navigator.language]
      : navigator.languages;
  if (!browserLocales || !browserLocales.length) {
    return defaultFormat;
  }

  return browserLocales[0];
}

export function getSeparator(
  locale: string,
  separatorType: 'decimal' | 'group'
) {
  const numberWithGroupAndDecimalSeparator = 1000.1;

  return Intl.NumberFormat(locale)
    .formatToParts(numberWithGroupAndDecimalSeparator)
    .find((part) => part.type === separatorType)?.value;
}

export const getDecimalSeparator = () => {
  const locale = getBrowserLocale();
  return getSeparator(locale, 'decimal') ?? defaultDecimalsSeparator;
};

export const getGroupSeparator = () => {
  const locale = getBrowserLocale();
  return getSeparator(locale, 'group') ?? defaultGroupSeparator;
};

export const getCoinFullBalance = (
  balance: number | string,
  decimals: number = 9
) => {
  if (!balance) return '0';

  const balanceFormat = new Intl.NumberFormat(getBrowserLocale(), {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });

  return balanceFormat.format(formatDecimals(balance, decimals));
};
