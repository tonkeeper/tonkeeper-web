import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { AccountRepr, JettonsBalances } from '@tonkeeper/core/dist/tonApiV1';
import { TonendpointStock } from '@tonkeeper/core/dist/tonkeeperApi/stock';
import {
  formatDecimals,
  getJettonStockAmount,
  getJettonStockPrice,
  getTonCoinStockPrice,
} from '@tonkeeper/core/dist/utils/balance';
import { toShortAddress } from '@tonkeeper/core/dist/utils/common';
import BigNumber from 'bignumber.js';
import React, { FC, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { useWalletContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { formatFiatCurrency } from '../../hooks/balance';
import { useUserJettonList } from '../../state/jetton';
import { SkeletonText } from '../Skeleton';
import { Label2, Num2 } from '../Text';

const Block = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 32px;
`;

const Body = styled(Label2)`
  color: ${(props) => props.theme.textSecondary};
  cursor: pointer;
  user-select: none;
`;

const Amount = styled(Num2)`
  margin-bottom: 0.5rem;
  user-select: none;
`;
const Error = styled.div`
  height: 26px;
`;

const useBalanceValue = (
  info: AccountRepr | undefined,
  stock: TonendpointStock | undefined,
  jettons: JettonsBalances,
  currency: FiatCurrencies
) => {
  return useMemo(() => {
    if (!info || !stock) {
      return formatFiatCurrency(currency, 0);
    }

    const ton = new BigNumber(info.balance).multipliedBy(
      formatDecimals(getTonCoinStockPrice(stock.today, currency))
    );

    const all = jettons.balances.reduce((total, jetton) => {
      const price = getJettonStockPrice(jetton, stock.today, currency);
      if (!price) return total;
      const amount = getJettonStockAmount(jetton, price);
      if (amount) {
        return total.plus(amount);
      } else {
        return total;
      }
    }, ton);

    return formatFiatCurrency(currency, all);
  }, [info, stock, jettons, currency]);
};

export const BalanceSkeleton = () => {
  return (
    <Block>
      <Error></Error>
      <Amount>
        <SkeletonText size="large" width="120px" />
      </Amount>
      <Body>
        <SkeletonText size="small" width="60px" />
      </Body>
    </Block>
  );
};

export const Balance: FC<{
  address: string;
  currency: FiatCurrencies;
  info?: AccountRepr | undefined;
  error?: Error | null;
  stock?: TonendpointStock | undefined;
  jettons?: JettonsBalances | undefined;
}> = ({ address, currency, info, error, stock, jettons }) => {
  const sdk = useAppSdk();
  const wallet = useWalletContext();

  const filtered = useUserJettonList(jettons);
  const total = useBalanceValue(info, stock, filtered, currency);

  const onClick = useCallback(() => {
    sdk.copyToClipboard(wallet.active.friendlyAddress);
  }, [sdk, wallet]);

  return (
    <Block>
      <Error>{error && error.message}</Error>
      <Amount>{total}</Amount>
      <Body onClick={onClick}>{toShortAddress(address)}</Body>
    </Block>
  );
};
