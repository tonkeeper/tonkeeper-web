export enum FiatCurrencies {
  USD = 'USD',
  EUR = 'EUR',
  RUB = 'RUB',
  AED = 'AED',
  UAH = 'UAH',
  GBP = 'GBP',
  CHF = 'CHF',
  CNY = 'CNY',
  KRW = 'KRW',
  IDR = 'IDR',
  INR = 'INR',
  JPY = 'JPY',
}

export type FiatCurrency = typeof FiatCurrencies[keyof typeof FiatCurrencies];

export interface CurrencyState {
  numberFormat: string;
  symbol: string;
  side: 'start' | 'end';
  maximumFractionDigits: number;
}

export const FiatCurrencySymbolsConfig: Record<FiatCurrency, CurrencyState> = {
  [FiatCurrencies.USD]: {
    numberFormat: 'en-US',
    symbol: '$',
    side: 'start',
    maximumFractionDigits: 2,
  },
  [FiatCurrencies.EUR]: {
    numberFormat: 'de-DE',
    symbol: '€',
    side: 'start',
    maximumFractionDigits: 2,
  },
  [FiatCurrencies.RUB]: {
    numberFormat: 'ru-RU',
    symbol: '₽',
    side: 'end',
    maximumFractionDigits: 2,
  },
  [FiatCurrencies.AED]: {
    numberFormat: 'en-US',
    symbol: 'Rp',
    side: 'end',
    maximumFractionDigits: 2,
  },
  [FiatCurrencies.UAH]: {
    numberFormat: 'en-US',
    symbol: '₴',
    side: 'end',
    maximumFractionDigits: 2,
  },
  [FiatCurrencies.GBP]: {
    numberFormat: 'en-GB',
    symbol: '£',
    side: 'start',
    maximumFractionDigits: 2,
  },
  [FiatCurrencies.CHF]: {
    numberFormat: 'en-US',
    symbol: '₣',
    side: 'start',
    maximumFractionDigits: 2,
  },
  [FiatCurrencies.CNY]: {
    numberFormat: 'en-US',
    symbol: '¥',
    side: 'start',
    maximumFractionDigits: 2,
  },
  [FiatCurrencies.KRW]: {
    numberFormat: 'en-US',
    symbol: '₩',
    side: 'start',
    maximumFractionDigits: 0,
  },
  [FiatCurrencies.IDR]: {
    numberFormat: 'en-US',
    symbol: 'Rp',
    side: 'end',
    maximumFractionDigits: 2,
  },
  [FiatCurrencies.INR]: {
    numberFormat: 'en-US',
    symbol: '₹',
    side: 'start',
    maximumFractionDigits: 2,
  },
  [FiatCurrencies.JPY]: {
    numberFormat: 'ja-JP',
    symbol: '¥',
    side: 'start',
    maximumFractionDigits: 2,
  },
};
