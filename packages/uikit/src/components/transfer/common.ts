import { JettonsBalances } from '@tonkeeper/core/dist/tonApiV1';
import { getFiatAmountValue } from '@tonkeeper/core/dist/utils/send';
import { useMemo } from 'react';
import { useAppContext } from '../../hooks/appContext';
import { formatFiatCurrency } from '../../hooks/balance';
import { useTonenpointStock } from '../../state/tonendpoint';

export const duration = 300;
export const timingFunction = 'ease-in-out';

export const useFiatAmount = (
  jettons: JettonsBalances,
  jetton: string,
  amount: string
) => {
  const { fiat } = useAppContext();
  const { data: stock } = useTonenpointStock();

  return useMemo(() => {
    const fiatAmount = getFiatAmountValue(stock, jettons, fiat, jetton, amount);
    if (fiatAmount === undefined) return undefined;
    return formatFiatCurrency(fiat, fiatAmount);
  }, [stock, jettons, fiat, jetton, amount]);
};
