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

type AmountNumber = string | number | BigNumber;

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
}
