import BigNumber from 'bignumber.js';
import { FiatCurrencies, FiatCurrencySymbolsConfig } from '@tonkeeper/core/dist/entries/fiat';
import { AmountFormatter } from '@tonkeeper/core/dist/utils/AmountFormatter';
import { getDecimalSeparator, getGroupSeparator } from '@tonkeeper/core/dist/utils/formatting';
import { formatNumberValue } from '@tonkeeper/core/dist/utils/send';

export type FiatFormatProfile = 'default' | 'significant';

interface BaseFormatDisplayAmountOptions {
    amount: BigNumber.Value;
    withUnit?: boolean;
}

export interface FormatDisplayTokenAmountOptions extends BaseFormatDisplayAmountOptions {
    kind: 'token';
    unit: string;
    decimalSeparator?: string;
    groupSeparator?: string;
}

export interface FormatDisplayFiatAmountOptions extends BaseFormatDisplayAmountOptions {
    kind: 'fiat';
    currency: FiatCurrencies;
    profile?: FiatFormatProfile;
    significantDigits?: number;
}

export type FormatDisplayAmountOptions =
    | FormatDisplayTokenAmountOptions
    | FormatDisplayFiatAmountOptions;

const fiatFormatter = new AmountFormatter({
    getLocaleFormat: () => ({
        decimalSeparator: getDecimalSeparator(),
        groupingSeparator: getGroupSeparator()
    })
});

const trimTrailingZeroes = (value: string) => {
    if (!value.includes('.')) {
        return value;
    }

    const trimmed = value.replace(/\.?0+$/g, '');
    return trimmed === '' ? '0' : trimmed;
};

const groupIntegerPart = (value: string, groupSeparator: string) => {
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator);
};

const formatCurrencyWithSymbol = (currency: FiatCurrencies, value: string) => {
    const conf = FiatCurrencySymbolsConfig[currency];
    if (!conf) {
        return `${value} ${currency}`;
    }

    return conf.side === 'start' ? `${conf.symbol} ${value}` : `${value} ${conf.symbol}`;
};

const normalizeTokenAmount = (value: BigNumber) => {
    if (value.gte(1000)) {
        return value.integerValue(BigNumber.ROUND_DOWN);
    }

    if (value.gte(1)) {
        return value.decimalPlaces(2, BigNumber.ROUND_DOWN);
    }

    if (value.gt(0)) {
        return value.precision(3, BigNumber.ROUND_DOWN);
    }

    return new BigNumber(0);
};

const formatTokenAmountNumber = (
    amount: BigNumber,
    options: Pick<FormatDisplayTokenAmountOptions, 'groupSeparator' | 'decimalSeparator'>
) => {
    const normalized = normalizeTokenAmount(amount.abs());
    const plainNumber = trimTrailingZeroes(normalized.toFixed());
    const [integerPart, decimalPart = ''] = plainNumber.split('.');
    const groupSeparator = options.groupSeparator ?? getGroupSeparator();
    const decimalSeparator = options.decimalSeparator ?? getDecimalSeparator();

    const groupedInteger = groupIntegerPart(integerPart, groupSeparator);
    const formattedNumber = decimalPart
        ? `${groupedInteger}${decimalSeparator}${decimalPart}`
        : groupedInteger;

    if (amount.isNegative() && !normalized.isZero()) {
        return `-${formattedNumber}`;
    }

    return formattedNumber;
};

const formatFiatDefault = (amount: BigNumber, currency: FiatCurrencies, withUnit: boolean) => {
    return fiatFormatter.format(amount.toString(), {
        currency: withUnit ? currency : undefined,
        ignoreZeroTruncate: false,
        decimals: 4
    });
};

const formatFiatSignificant = (
    amount: BigNumber,
    currency: FiatCurrencies,
    withUnit: boolean,
    significantDigits: number
) => {
    const normalized = amount.abs().precision(significantDigits, BigNumber.ROUND_DOWN);
    const value = normalized.isZero() ? '0' : formatNumberValue(normalized);
    const signedValue = amount.isNegative() && !normalized.isZero() ? `-${value}` : value;

    if (!withUnit) {
        return signedValue;
    }

    return formatCurrencyWithSymbol(currency, signedValue);
};

export const formatDisplayAmount = (options: FormatDisplayAmountOptions) => {
    const bn = BigNumber.isBigNumber(options.amount)
        ? options.amount
        : new BigNumber(options.amount);
    const withUnit = options.withUnit !== false;

    if (!bn.isFinite()) {
        if (options.kind === 'token') {
            return withUnit ? `0 ${options.unit}` : '0';
        }

        return withUnit ? formatCurrencyWithSymbol(options.currency, '0') : '0';
    }

    if (options.kind === 'token') {
        const value = formatTokenAmountNumber(bn, options);
        return withUnit ? `${value} ${options.unit}` : value;
    }

    if (options.profile === 'significant') {
        return formatFiatSignificant(
            bn,
            options.currency,
            withUnit,
            options.significantDigits ?? 3
        );
    }

    return formatFiatDefault(bn, options.currency, withUnit);
};
