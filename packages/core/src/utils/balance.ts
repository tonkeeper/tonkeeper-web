import BigNumber from 'bignumber.js';
import { FiatCurrencies } from '../entries/fiat';
import { DefaultDecimals } from './send';

export const formatDecimals = (
    amount: BigNumber.Value,
    decimals: number | string = DefaultDecimals
): number => {
    decimals = typeof decimals === 'string' ? parseInt(decimals) : decimals;
    return new BigNumber(amount).shiftedBy(-decimals).toNumber();
};

export const shiftedDecimals = (
    amount: BigNumber.Value,
    decimals: number | string = DefaultDecimals
): BigNumber => {
    decimals = typeof decimals === 'string' ? parseInt(decimals) : decimals;
    return new BigNumber(amount).shiftedBy(-decimals);
};

export const unShiftedDecimals = (
    amount: BigNumber.Value,
    decimals: number | string = DefaultDecimals
): BigNumber => {
    decimals = typeof decimals === 'string' ? parseInt(decimals) : decimals;
    return new BigNumber(amount).shiftedBy(decimals);
};

export const getStockPrice = (
    coin: string,
    rates: { [key: string]: string },
    currency: FiatCurrencies
): BigNumber | null => {
    const btcPrice = rates[coin];
    const btcInFiat = rates[currency];

    if (!btcPrice || !btcInFiat) return null;

    return new BigNumber(btcInFiat).div(new BigNumber(btcPrice));
};
