import { BRAND_CONFIG } from '../config/brand';

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

    GRAM = 'GRAM'
}

export type FiatCurrency = (typeof FiatCurrencies)[keyof typeof FiatCurrencies];

/** Persisted settings can still hold "TON", the native coin's code before GRAM. */
export function normalizeFiatCode<T extends string>(code: T): T | FiatCurrencies.GRAM {
    return code.toUpperCase() === 'TON' ? FiatCurrencies.GRAM : code;
}

export interface CurrencyState {
    symbol: string;
    side: 'start' | 'end';
}

/**
 * Offline fallback symbols, used until the backend symbol for the selected
 * currency has been stored.
 */
export const FiatCurrencySymbolsConfig: Record<FiatCurrency, string> = {
    [FiatCurrencies.USD]: '$',
    [FiatCurrencies.EUR]: '€',
    [FiatCurrencies.RUB]: '₽',
    [FiatCurrencies.AED]: 'DH',
    [FiatCurrencies.KZT]: '₸',
    [FiatCurrencies.UAH]: '₴',
    [FiatCurrencies.GBP]: '£',
    [FiatCurrencies.CHF]: '₣',
    [FiatCurrencies.CNY]: '¥',
    [FiatCurrencies.KRW]: '₩',
    [FiatCurrencies.IDR]: 'Rp',
    [FiatCurrencies.INR]: '₹',
    [FiatCurrencies.JPY]: '¥',
    [FiatCurrencies.GRAM]: BRAND_CONFIG.coinSymbol
};

/**
 * Currencies whose symbol leads the amount, following each currency's
 * home-locale CLDR convention as seen in a left-to-right UI: ILS, EGP and
 * LBP lead because their RTL-locale trailing symbol renders on the left.
 * EUR leads by product choice. Everything else trails, and so does any
 * symbol that is just the ISO code ("1 234 SAR").
 */
const SYMBOL_FIRST_CURRENCIES = new Set([
    'USD',
    'EUR',
    'GBP',
    'JPY',
    'CNY',
    'KRW',
    'INR',
    'IDR',
    'CHF',
    'NGN',
    'PKR',
    'CAD',
    'ETB',
    'TRY',
    'PHP',
    'SGD',
    'AUD',
    'BRL',
    'KES',
    'NOK',
    'THB',
    'MYR',
    'VES',
    'NPR',
    'UGX',
    'ZAR',
    'LKR',
    'HKD',
    'MXN',
    'ARS',
    'COP',
    'NZD',
    'RWF',
    'TWD',
    'ZMW',
    'MGA',
    'CLP',
    'LAK',
    'DOP',
    'SLE',
    'BOB',
    'LRD',
    'NAD',
    'BWP',
    'PYG',
    'TTD',
    'JMD',
    'MNT',
    'SSP',
    'GTQ',
    'CRC',
    'MUR',
    'HNL',
    'NIO',
    'BND',
    'SRD',
    'BSD',
    'SBD',
    'GYD',
    'XCD',
    'FJD',
    'BBD',
    'BZD',
    'BMD',
    'ILS',
    'EGP',
    'LBP'
]);

const remoteFiatSymbols = new Map<string, string>();

/**
 * Symbol from the backend currency list. Registered once at boot from
 * storage, so formatting stays synchronous and never waits on the
 * `/currencies` request.
 */
export function registerFiatSymbol(currency: string, symbol: string) {
    remoteFiatSymbols.set(currency, symbol);
}

export function getFiatCurrencyState(currency: string): CurrencyState | undefined {
    const symbol =
        remoteFiatSymbols.get(currency) ?? FiatCurrencySymbolsConfig[currency as FiatCurrency];
    if (!symbol) return undefined;
    const leads = symbol !== currency && SYMBOL_FIRST_CURRENCIES.has(currency);
    return { symbol, side: leads ? 'start' : 'end' };
}
