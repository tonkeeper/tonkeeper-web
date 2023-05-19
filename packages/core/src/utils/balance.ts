import BigNumber from 'bignumber.js';
import { Address } from 'ton-core';
import { CryptoCurrency } from '../entries/crypto';
import { FiatCurrencies } from '../entries/fiat';
import { JettonBalance } from '../tonApiV1';
import { DefaultDecimals } from './send';

export const formatDecimals = (
  amount: BigNumber.Value,
  decimals: number = DefaultDecimals
): number => {
  return new BigNumber(amount).shiftedBy(-decimals).toNumber();
};

export const shiftedDecimals = (
  amount: BigNumber.Value,
  decimals: number = DefaultDecimals
): BigNumber => {
  return new BigNumber(amount).shiftedBy(-decimals);
};

export const getTonCoinStockPrice = (
  rates: { [key: string]: string },
  currency: FiatCurrencies
): BigNumber => {
  const btcPrice = rates[CryptoCurrency.TON];
  const btcInFiat = rates[currency] ?? rates[FiatCurrencies.USD];

  return new BigNumber(btcInFiat).div(new BigNumber(btcPrice));
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

export const getJettonStockAmount = (
  jetton: JettonBalance,
  price: BigNumber | null
) => {
  if (!price) return null;
  return formatDecimals(
    price.multipliedBy(jetton.balance),
    jetton.metadata?.decimals
  );
};

export const getJettonStockPrice = (
  jetton: JettonBalance,
  rates: { [key: string]: string },
  currency: FiatCurrencies
) => {
  return getStockPrice(
    Address.parse(jetton.jettonAddress).toString(),
    rates,
    currency
  );
};
