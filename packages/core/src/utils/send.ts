import BigNumber from 'bignumber.js';
import { CryptoCurrency } from '../entries/crypto';
import { FiatCurrencies } from '../entries/fiat';
import { AccountRepr, JettonsBalances } from '../tonApiV1';
import { TonendpointStock } from '../tonkeeperApi/stock';
import { getJettonStockPrice, getTonCoinStockPrice } from './balance';

export const DefaultDecimals = 9;

export function removeCommas(str: string): string {
  return str.replaceAll(',', '');
}

export function toStringAmount(str: string): string {
  return str;
}
export function toNumberAmount(str: string): number {
  return parseFloat(str);
}
export function isNumeric(str: string) {
  return !isNaN(Number(str)) && !isNaN(parseFloat(str));
}

export function seeIfLargeTail(str: string, decimals: number) {
  const [entry, tail] = str.trim().replaceAll(',', '').split('.');
  if (tail && tail.length > decimals) return true;
  return false;
}

export const getJettonSymbol = (
  address: string,
  jettons: JettonsBalances
): string => {
  const jetton = jettons.balances.find(
    (item) => item.jettonAddress === address
  );
  return jetton?.metadata?.symbol ?? address;
};

export const getJettonDecimals = (
  address: string,
  jettons: JettonsBalances
): number => {
  const jetton = jettons.balances.find(
    (item) => item.jettonAddress === address
  );
  return jetton?.metadata?.decimals ?? DefaultDecimals;
};

export const getMaxValue = (
  jettons: JettonsBalances,
  info: AccountRepr | undefined,
  jetton: string,
  format: (amount: number | string, decimals?: number) => string
): string => {
  if (jetton === CryptoCurrency.TON) {
    return removeCommas(format(info?.balance ?? 0));
  }

  const jettonInfo = jettons.balances.find(
    (item) => item.jettonAddress === jetton
  );
  return removeCommas(
    format(jettonInfo?.balance ?? 0, jettonInfo?.metadata?.decimals)
  );
};

export const getRemaining = (
  jettons: JettonsBalances,
  info: AccountRepr | undefined,
  jetton: string,
  amount: string,
  max: boolean,
  format: (amount: number | string, decimals?: number) => string
): [string, boolean] => {
  if (jetton === CryptoCurrency.TON) {
    if (max) {
      return [`0 ${CryptoCurrency.TON}`, true];
    }

    const remaining = new BigNumber(info?.balance ?? 0).minus(
      isNumeric(amount)
        ? new BigNumber(toNumberAmount(amount)).multipliedBy(
            Math.pow(10, DefaultDecimals)
          )
        : 0
    );

    return [
      `${format(remaining.toString())} ${CryptoCurrency.TON}`,
      remaining.isGreaterThan(0),
    ];
  }

  const jettonInfo = jettons.balances.find(
    (item) => item.jettonAddress === jetton
  );
  if (!jettonInfo) {
    return ['0', false];
  }

  if (max) {
    return [`0 ${jettonInfo.metadata?.symbol}`, true];
  }

  const remaining = new BigNumber(jettonInfo.balance).minus(
    isNumeric(amount)
      ? new BigNumber(toNumberAmount(amount)).multipliedBy(
          Math.pow(10, jettonInfo.metadata?.decimals ?? DefaultDecimals)
        )
      : 0
  );

  return [
    `${format(remaining.toString(), jettonInfo.metadata?.decimals)} ${
      jettonInfo.metadata?.symbol
    }`,
    remaining.isGreaterThanOrEqualTo(0),
  ];
};

export const getFiatAmountValue = (
  stock: TonendpointStock | undefined,
  jettons: JettonsBalances,
  fiat: FiatCurrencies,
  jetton: string,
  amount: string
) => {
  if (!isNumeric(amount)) return undefined;
  if (!stock) return undefined;

  const value = new BigNumber(toNumberAmount(amount));

  if (jetton === CryptoCurrency.TON) {
    const price = getTonCoinStockPrice(stock.today, fiat);
    return value.multipliedBy(price);
  } else {
    const jettonInfo = jettons.balances.find(
      (item) => item.jettonAddress === jetton
    );

    if (!jettonInfo) return undefined;

    const price = getJettonStockPrice(jettonInfo, stock.today, fiat);
    if (!price) return undefined;
    return value.multipliedBy(price);
  }
};
