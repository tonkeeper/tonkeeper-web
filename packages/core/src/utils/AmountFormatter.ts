import { fromNano } from '@ton/core';
import BigNumber from 'bignumber.js';
import { FiatCurrency, FiatCurrencySymbolsConfig } from '../entries/fiat';

type LocaleFormat = {
    groupingSeparator: string;
    decimalSeparator: string;
};

type AmountFormatterOptions = {
    getDefaultDecimals?: (bn: BigNumber) => number;
    getLocaleFormat?: () => LocaleFormat;
};

type AmountFormatOptions = {
    decimals?: number | string;
    currency?: FiatCurrency;
    ignoreZeroTruncate?: boolean;
};

type DisplayFormatOptions = {
    unit?: string;
    currency?: FiatCurrency;
};

type AmountNumber = string | number | BigNumber | BigNumber.Value;

export class AmountFormatter {
    private getDefaultDecimals: (bn: BigNumber) => number;

    private getLocaleFormat: () => LocaleFormat;

    constructor(options: AmountFormatterOptions) {
        if (options.getDefaultDecimals) {
            this.getDefaultDecimals = options.getDefaultDecimals;
        } else {
            this.getDefaultDecimals = () => 2;
        }

        if (options.getLocaleFormat) {
            this.getLocaleFormat = options.getLocaleFormat;
        } else {
            this.getLocaleFormat = () => ({
                decimalSeparator: '.',
                groupingSeparator: ','
            });
        }
    }

    public toNano(amount: number | string, decimals?: number) {
        let bn = new BigNumber(amount ?? 0);
        if (decimals) {
            bn = bn.decimalPlaces(decimals, BigNumber.ROUND_DOWN);
        }
        return bn.shiftedBy(decimals ?? 9).toString(10);
    }

    public fromNano(amount: AmountNumber) {
        return fromNano(amount.toString());
    }

    private toBN(amount: AmountNumber = 0) {
        return BigNumber.isBigNumber(amount) ? amount : new BigNumber(amount);
    }

    public format(amount: AmountNumber = 0, options: AmountFormatOptions = {}) {
        let bn = this.toBN(amount);

        const decimals = options.decimals ?? this.getDefaultDecimals(bn);
        let prefix = '';
        let suffix = '';

        if (bn.isNegative()) {
            bn = bn.abs();
            prefix += '− ';
        }

        if (options.currency) {
            const conf = FiatCurrencySymbolsConfig[options.currency];
            if (conf) {
                if (conf.side === 'start') {
                    prefix += conf.symbol + ' ';
                } else {
                    suffix = ' ' + conf.symbol;
                }
            } else {
                suffix = ' ' + options.currency;
            }
        }

        const { decimalSeparator, groupingSeparator } = this.getLocaleFormat();
        const formatConf = {
            groupSeparator: groupingSeparator,
            decimalSeparator,
            fractionGroupSize: 2,
            groupSize: 3,
            prefix,
            suffix
        };

        // truncate decimals 1.00 -> 1
        if (!options.ignoreZeroTruncate && bn.isLessThan('0.01')) {
            bn = bn.decimalPlaces(new BigNumber(decimals).toNumber(), BigNumber.ROUND_DOWN);
            return bn.toFormat(formatConf);
        }

        return bn.toFormat(
            Math.min(new BigNumber(decimals).toNumber(), 2),
            BigNumber.ROUND_DOWN,
            formatConf
        );
    }

    private normalize(bn: BigNumber): BigNumber {
        if (bn.gte(1000)) return bn.integerValue(BigNumber.ROUND_DOWN);
        if (bn.gte(1)) return bn.decimalPlaces(2, BigNumber.ROUND_DOWN);
        if (bn.gt(0)) return bn.precision(3, BigNumber.ROUND_DOWN);
        return new BigNumber(0);
    }

    private trimTrailingZeroes(value: string): string {
        if (!value.includes('.')) return value;
        const trimmed = value.replace(/\.?0+$/g, '');
        return trimmed === '' ? '0' : trimmed;
    }

    private groupIntegerPart(value: string, groupSeparator: string): string {
        return value.replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator);
    }

    public formatDisplay(amount: AmountNumber = 0, options: DisplayFormatOptions = {}): string {
        const bn = this.toBN(amount);
        const { decimalSeparator, groupingSeparator } = this.getLocaleFormat();

        if (!bn.isFinite()) {
            const zero = '0';
            if (options.unit) return `${zero} ${options.unit}`;
            if (options.currency) return this.wrapCurrency(zero, options.currency);
            return zero;
        }

        const normalized = this.normalize(bn.abs());
        const plain = this.trimTrailingZeroes(normalized.toFixed());
        const [intPart, decPart = ''] = plain.split('.');

        const groupedInt = this.groupIntegerPart(intPart, groupingSeparator);
        let formatted = decPart ? `${groupedInt}${decimalSeparator}${decPart}` : groupedInt;

        if (bn.isNegative() && !normalized.isZero()) {
            formatted = `-${formatted}`;
        }

        if (options.unit) return `${formatted} ${options.unit}`;
        if (options.currency) return this.wrapCurrency(formatted, options.currency);
        return formatted;
    }

    private wrapCurrency(value: string, currency: FiatCurrency): string {
        const conf = FiatCurrencySymbolsConfig[currency];
        if (!conf) return `${value} ${currency}`;
        return conf.side === 'start' ? `${conf.symbol} ${value}` : `${value} ${conf.symbol}`;
    }
}
