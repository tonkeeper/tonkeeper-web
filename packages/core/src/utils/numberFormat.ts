import BigNumber from 'bignumber.js';
import { FiatCurrency, getFiatCurrencyState } from '../entries/fiat';
import { intlLocale } from '../entries/language';
import { AmountFormatter } from './AmountFormatter';

/**
 * The one place that turns numbers into user-visible text. Separators follow
 * the app language rather than the browser locale, and digits stay Latin in
 * every language because the UI font has no Arabic-Indic or Bengali glyphs.
 */

export type NumberInput = BigNumber.Value | bigint;

type Separators = { decimalSeparator: string; groupingSeparator: string };

const fallbackLocale = 'en-u-nu-latn';

let locale = fallbackLocale;

const separatorsByLocale = new Map<string, Separators>();

export const setNumberFormatLanguage = (language: string) => {
    const tag = `${intlLocale(language)}-u-nu-latn`;
    try {
        locale = Intl.NumberFormat.supportedLocalesOf(tag).length ? tag : fallbackLocale;
    } catch {
        locale = fallbackLocale;
    }
};

export const getNumberLocale = () => locale;

export const getNumberSeparators = (): Separators => {
    let separators = separatorsByLocale.get(locale);
    if (!separators) {
        const parts = new Intl.NumberFormat(locale).formatToParts(1000.1);
        separators = {
            decimalSeparator: parts.find(part => part.type === 'decimal')?.value ?? '.',
            groupingSeparator: parts.find(part => part.type === 'group')?.value ?? ','
        };
        separatorsByLocale.set(locale, separators);
    }
    return separators;
};

export const amountFormatter = new AmountFormatter({ getLocaleFormat: getNumberSeparators });

const toBN = (value: NumberInput) =>
    new BigNumber(typeof value === 'bigint' ? value.toString() : value);

const withCurrency = (value: string, currency: FiatCurrency) => {
    const conf = getFiatCurrencyState(currency);
    if (!conf) return `${value} ${currency}`;
    return conf.side === 'start' ? `${conf.symbol} ${value}` : `${value} ${conf.symbol}`;
};

/**
 * Token or fiat amount under the display rounding rules: integers from 1000,
 * two decimals from 1, three significant digits below 1. `exact` keeps every
 * decimal for screens where the precise value matters (confirmations, the
 * balance next to MAX).
 */
export const formatAmount = (
    value: NumberInput,
    options: { unit?: string; currency?: FiatCurrency; exact?: boolean } = {}
): string => amountFormatter.formatDisplay(toBN(value), options);

/** A plain decimal with up to `maxFractionDigits`, trailing zeros dropped. */
export const formatDecimal = (value: NumberInput, maxFractionDigits = 2): string => {
    const bn = toBN(value);
    if (!bn.isFinite()) return '';
    const { decimalSeparator, groupingSeparator } = getNumberSeparators();
    return bn.decimalPlaces(maxFractionDigits, BigNumber.ROUND_HALF_UP).toFormat({
        decimalSeparator,
        groupSeparator: groupingSeparator,
        groupSize: 3
    });
};

/** `6.12%`; `signed` adds `+` to positive values, for changes and differences. */
export const formatPercent = (value: NumberInput, options: { signed?: boolean } = {}): string => {
    const bn = toBN(value);
    if (!bn.isFinite()) return '';
    const sign = options.signed && bn.decimalPlaces(2).gt(0) ? '+' : '';
    return `${sign}${formatDecimal(bn)}%`;
};

/** Abbreviated magnitude for market caps, supplies and volumes: `3.65B`, `3,65 млрд`. */
export const formatCompact = (value: NumberInput, options: { currency?: FiatCurrency } = {}) => {
    const n = toBN(value).toNumber();
    if (!Number.isFinite(n)) return '';
    const compact = new Intl.NumberFormat(locale, {
        notation: 'compact',
        maximumFractionDigits: 2
    }).format(n);
    return options.currency ? withCurrency(compact, options.currency) : compact;
};

/** Whole-number counts such as Battery charges, grouped by thousands. */
export const formatCount = (value: NumberInput): string => {
    const bn = toBN(value);
    if (!bn.isFinite()) return '0';
    const { groupingSeparator } = getNumberSeparators();
    return bn
        .integerValue(BigNumber.ROUND_DOWN)
        .toFormat({ groupSeparator: groupingSeparator, groupSize: 3 });
};

/** An amount input's text for a `.` decimal string, with the language's decimal separator. */
export const toAmountInput = (value: string): string =>
    value.replace('.', getNumberSeparators().decimalSeparator);

/** Reads an amount input back to a `.` decimal string; either separator is accepted as typed. */
export const fromAmountInput = (text: string): string => text.replace(',', '.');
