import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { AmountData } from '@tonkeeper/core/dist/entries/send';
import { JettonsBalances } from '@tonkeeper/core/dist/tonApiV1';
import { TonendpointStock } from '@tonkeeper/core/dist/tonkeeperApi/stock';
import {
  cropTail,
  formatNumberValue,
  getCoinAmountValue,
  getFiatAmountValue,
  getJettonDecimals,
  getJettonSymbol,
} from '@tonkeeper/core/dist/utils/send';
import { formatter } from '../../hooks/balance';

export type AmountState = AmountFiatState | AmountCoinState;

export interface AmountCoinState {
  primaryValue: string;
  primarySymbol: string;
  secondaryValue?: string;
  secondarySymbol: string;
  inFiat: false;
}

export interface AmountFiatState {
  primaryValue: string;
  primarySymbol: string;
  secondaryValue: string;
  secondarySymbol: string;
  inFiat: true;
}

export type StateOptions = {
  fiat: FiatCurrencies;
  jettons: JettonsBalances;
  jetton: string;
  stock: TonendpointStock | undefined;
};
const getFiatValue = (coinValue: string, options: StateOptions) => {
  const fiatAmount = getFiatAmountValue(
    options.stock,
    options.jettons,
    options.fiat,
    options.jetton,
    coinValue == '' ? '0' : coinValue
  );

  if (!fiatAmount) return undefined;
  return formatter.format(fiatAmount.toString(), {
    ignoreZeroTruncate: true,
  });
};

const getCoinValue = (fiatValue: string, options: StateOptions) => {
  const coinAmount = getCoinAmountValue(
    options.stock,
    options.jettons,
    options.fiat,
    options.jetton,
    fiatValue
  );

  if (!coinAmount) {
    return undefined;
  }
  return formatter.format(coinAmount.toFormat(2), {
    ignoreZeroTruncate: false,
  });
};

const getCoinValueOrDie = (fiatValue: string, options: StateOptions) => {
  const coinAmount = getCoinValue(fiatValue, options);
  if (coinAmount == undefined) {
    throw new Error('Missing coin amount');
  }
  return coinAmount;
};

export const initAmountState = (
  options: {
    data?: AmountData;
  } & StateOptions
): AmountState => {
  const jettonSymbol = getJettonSymbol(options.jetton, options.jettons);
  const { data } = options;
  if (data == null) {
    return {
      primaryValue: '0',
      primarySymbol: jettonSymbol,
      inFiat: false,
      secondaryValue: getFiatValue('0', options),
      secondarySymbol: options.fiat,
    };
  }

  if (data.fiat) {
    const primaryValue = formatNumberValue(data.fiat);
    const secondaryValue = formatNumberValue(data.amount);
    return {
      primaryValue: primaryValue,
      primarySymbol: options.fiat,
      inFiat: true,
      secondaryValue: secondaryValue,
      secondarySymbol: jettonSymbol,
    };
  } else {
    const primaryValue = formatNumberValue(data.amount);

    return {
      primaryValue: primaryValue,
      primarySymbol: jettonSymbol,
      inFiat: false,
      secondaryValue: getFiatValue(primaryValue, options),
      secondarySymbol: options.fiat,
    };
  }
};

export const getCoinAmount = (state: AmountState): string => {
  if (state.inFiat) {
    return state.secondaryValue;
  } else {
    return state.primaryValue;
  }
};

export const toggleAmountState = (state: AmountState): AmountState => {
  if (state.inFiat) {
    const { primarySymbol, primaryValue, secondarySymbol, secondaryValue } =
      state;
    return {
      primarySymbol: secondarySymbol,
      primaryValue: secondaryValue,
      secondarySymbol: primarySymbol,
      secondaryValue: primaryValue,
      inFiat: false,
    };
  } else {
    const { primarySymbol, primaryValue, secondarySymbol, secondaryValue } =
      state;
    if (secondaryValue == undefined) {
      return state; // Missing fiat amount
    } else {
      return {
        primarySymbol: secondarySymbol,
        primaryValue: secondaryValue,
        secondarySymbol: primarySymbol,
        secondaryValue: primaryValue,
        inFiat: true,
      };
    }
  }
};

export const setAmountStateValue = (
  options: {
    value: string;
    state: AmountState;
  } & StateOptions
): AmountState => {
  const { value, state } = options;

  if (state.inFiat) {
    return {
      primaryValue: value,
      primarySymbol: state.primarySymbol,
      inFiat: true,
      secondaryValue: getCoinValueOrDie(value, options),
      secondarySymbol: state.secondarySymbol,
    };
  } else {
    return {
      primaryValue: value,
      primarySymbol: state.primarySymbol,
      inFiat: false,
      secondaryValue: getFiatValue(value, options),
      secondarySymbol: state.secondarySymbol,
    };
  }
};

export const setAmountStateMax = (
  options: {
    value: string;
    state: AmountState;
  } & StateOptions
): AmountState => {
  const { value, state } = options;

  return {
    primaryValue: value,
    primarySymbol: state.primarySymbol,
    inFiat: false,
    secondaryValue: getFiatValue(value, options),
    secondarySymbol: state.secondarySymbol,
  };
};

export const setAmountStateJetton = (
  options: {
    state: AmountState;
    newMaxValue?: string;
  } & StateOptions
): AmountState => {
  const { state, newMaxValue } = options;

  const jettonSymbol = getJettonSymbol(options.jetton, options.jettons);

  if (newMaxValue) {
    return {
      primaryValue: newMaxValue,
      primarySymbol: jettonSymbol,
      inFiat: false,
      secondaryValue: getFiatValue(newMaxValue, options),
      secondarySymbol: options.fiat,
    };
  }

  if (state.inFiat) {
    const secondaryValue = getCoinValue(state.primaryValue, options);
    if (secondaryValue == undefined) {
      return {
        primaryValue: state.primaryValue,
        primarySymbol: jettonSymbol,
        inFiat: false,
        secondaryValue: undefined,
        secondarySymbol: options.fiat,
      };
    } else {
      return {
        primaryValue: state.primaryValue,
        primarySymbol: options.fiat,
        inFiat: state.inFiat,
        secondaryValue: secondaryValue,
        secondarySymbol: jettonSymbol,
      };
    }
  } else {
    const decimals = getJettonDecimals(options.jetton, options.jettons);
    const primaryValue = cropTail(state.primaryValue, decimals);
    return {
      primaryValue: primaryValue,
      primarySymbol: jettonSymbol,
      inFiat: false,
      secondaryValue: getFiatValue(primaryValue, options),
      secondarySymbol: options.fiat,
    };
  }
};
