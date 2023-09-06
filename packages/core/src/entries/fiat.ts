export enum FiatCurrencies {
    USD = 'USD',
    EUR = 'EUR',
    RUB = 'RUB',
    AED = 'AED',
    KZT = 'KZT',
    UAH = 'UAH',
    GBP = 'GBP',
    CHF = 'CHF',
    CNY = 'CNY',
    KRW = 'KRW',
    IDR = 'IDR',
    INR = 'INR',
    JPY = 'JPY',

    TON = 'TON'
}

export type FiatCurrency = (typeof FiatCurrencies)[keyof typeof FiatCurrencies];

export interface CurrencyState {
    symbol: string;
    side: 'start' | 'end';
    maximumFractionDigits: number;
}

export const FiatCurrencySymbolsConfig: Record<FiatCurrency, CurrencyState> = {
    [FiatCurrencies.USD]: {
        symbol: '$',
        side: 'start',
        maximumFractionDigits: 2
    },
    [FiatCurrencies.EUR]: {
        symbol: '€',
        side: 'start',
        maximumFractionDigits: 2
    },
    [FiatCurrencies.RUB]: {
        symbol: '₽',
        side: 'end',
        maximumFractionDigits: 2
    },
    [FiatCurrencies.AED]: {
        symbol: 'DH',
        side: 'end',
        maximumFractionDigits: 2
    },
    [FiatCurrencies.KZT]: {
        symbol: '₸',
        side: 'end',
        maximumFractionDigits: 2
    },
    [FiatCurrencies.UAH]: {
        symbol: '₴',
        side: 'end',
        maximumFractionDigits: 2
    },
    [FiatCurrencies.GBP]: {
        symbol: '£',
        side: 'start',
        maximumFractionDigits: 2
    },
    [FiatCurrencies.CHF]: {
        symbol: '₣',
        side: 'start',
        maximumFractionDigits: 2
    },
    [FiatCurrencies.CNY]: {
        symbol: '¥',
        side: 'start',
        maximumFractionDigits: 2
    },
    [FiatCurrencies.KRW]: {
        symbol: '₩',
        side: 'start',
        maximumFractionDigits: 0
    },
    [FiatCurrencies.IDR]: {
        symbol: 'Rp',
        side: 'end',
        maximumFractionDigits: 2
    },
    [FiatCurrencies.INR]: {
        symbol: '₹',
        side: 'start',
        maximumFractionDigits: 2
    },
    [FiatCurrencies.JPY]: {
        symbol: '¥',
        side: 'start',
        maximumFractionDigits: 2
    },
    [FiatCurrencies.TON]: {
        symbol: 'TON',
        side: 'end',
        maximumFractionDigits: 2
    }
};
