import BigNumber from 'bignumber.js';
import { FiatCurrencies } from '../entries/fiat';
import { AccountRepr, JettonsBalances } from '../tonApi';
import { TonendpointStock } from '../tonkeeperApi/stock';
import { getJettonStockPrice, getTonCoinStockPrice } from './balance';

export const TONAsset = 'TON';
export const DefaultDecimals = 9;

export function toNumberAmount(str: string): number {
  str = str.replaceAll(',', '');
  return parseFloat(str);
}
export function isNumeric(str: string) {
  str = str.replaceAll(',', '');
  return !isNaN(Number(str)) && !isNaN(parseFloat(str));
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
  if (jetton === TONAsset) {
    return format(info?.balance ?? 0);
  }

  const jettonInfo = jettons.balances.find(
    (item) => item.jettonAddress === jetton
  );
  return format(jettonInfo?.balance ?? 0, jettonInfo?.metadata?.decimals);
};

export const getRemaining = (
  jettons: JettonsBalances,
  info: AccountRepr | undefined,
  jetton: string,
  amount: string,
  max: boolean,
  format: (amount: number | string, decimals?: number) => string
): [string, boolean] => {
  if (jetton === TONAsset) {
    if (max) {
      return [`0 ${TONAsset}`, true];
    }

    const remaining = new BigNumber(info?.balance ?? 0).minus(
      isNumeric(amount)
        ? new BigNumber(toNumberAmount(amount)).multipliedBy(
            Math.pow(10, DefaultDecimals)
          )
        : 0
    );

    return [
      `${format(remaining.toString())} ${TONAsset}`,
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

export const parseAndValidateInput = (
  value: string,
  jettons: JettonsBalances,
  jetton: string,
  format: (amount: number | string, decimals?: number) => string
): string | undefined => {
  if (value.trim() == '') return '';
  if (value.length > 22) return;
  try {
    const [entry, ...tail] = value.trim().replaceAll(',', '').split('.');
    if (entry.length > 11) return;
    const start = parseInt(entry, 10);

    if (isNaN(start)) {
      throw new Error('Not a number');
    }

    if (tail.length > 1) return;
    const decimals = getJettonDecimals(jetton, jettons);
    if (tail.length && tail[0].length > decimals) return;

    return [format(start, 0), ...tail].join('.');
  } catch (e) {
    return value;
  }
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

  if (jetton === TONAsset) {
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
