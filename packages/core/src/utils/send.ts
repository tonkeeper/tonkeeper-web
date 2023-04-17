import BigNumber from 'bignumber.js';
import { CryptoCurrency } from '../entries/crypto';
import { FiatCurrencies } from '../entries/fiat';
import { AccountRepr, JettonsBalances } from '../tonApiV1';
import { TonendpointStock } from '../tonkeeperApi/stock';
import { getJettonStockPrice, getTonCoinStockPrice } from './balance';
import {
  getBrowserLocale,
  getDecimalSeparator,
  getGroupSeparator,
} from './formatting';

export const DefaultDecimals = 9;

export function removeGroupSeparator(str: string): string {
  return str.replaceAll(getGroupSeparator(), '');
}

export function toNumberAmount(str: string): number {
  return parseFloat(str);
}
export function isNumeric(str: string) {
  const [entry, tail] = removeGroupSeparator(str.trim()).split(
    getDecimalSeparator()
  );

  return /^[0-9]+$/.test(entry) && (!tail || /^[0-9]+$/.test(tail));
}

export function seeIfLargeTail(str: string, decimals: number) {
  const [entry, tail] = removeGroupSeparator(str.trim()).split(
    getDecimalSeparator()
  );
  if (tail && tail.length > decimals) return true;
  return false;
}

export function getDecimalLength(str: string) {
  const [entry, tail] = removeGroupSeparator(str.trim()).split(
    getDecimalSeparator()
  );
  return tail ? tail.length : 0;
}

export function formatSendValue(str: string) {
  const [entry, tail] = removeGroupSeparator(str.trim()).split(
    getDecimalSeparator()
  );

  const path = [] as string[];
  path.push(new Intl.NumberFormat(getBrowserLocale()).format(parseInt(entry)));
  if (tail !== undefined) {
    path.push(tail);
  }
  return path.join(getDecimalSeparator());
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
    return removeGroupSeparator(format(info?.balance ?? 0));
  }

  const jettonInfo = jettons.balances.find(
    (item) => item.jettonAddress === jetton
  );
  return removeGroupSeparator(
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

    amount = removeGroupSeparator(amount);

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
  amount = removeGroupSeparator(amount);

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
