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
import { useTranslation } from '../../hooks/translation';
import { useUserJettonList } from '../../state/jetton';
import { SkeletonText } from '../Skeleton';
import { Body3, Label2, Num2 } from '../Text';

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
  text-align: center;
  width: 100%;
`;

const Text = styled(Body3)`
  line-height: 26px;
  color: ${(props) => props.theme.textSecondary};
`;
const MessageBlock: FC<{ error?: Error | null; isFetching: boolean }> = ({
  error,
  isFetching,
}) => {
  const { t } = useTranslation();
  if (isFetching) {
    return (
      <Error>
        <Text>{t('loading')}</Text>
      </Error>
    );
  }

  if (error) {
    return (
      <Error>
        <Text>{error.message}</Text>
      </Error>
    );
  }

  return <Error></Error>;
};

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
  isFetching: boolean;
}> = ({ address, currency, info, error, stock, jettons, isFetching }) => {
  const sdk = useAppSdk();
  const wallet = useWalletContext();

  const filtered = useUserJettonList(jettons);
  const total = useBalanceValue(info, stock, filtered, currency);

  const onClick = useCallback(() => {
    sdk.copyToClipboard(wallet.active.friendlyAddress);
  }, [sdk, wallet]);

  return (
    <Block>
      <MessageBlock error={error} isFetching={isFetching} />
      <Amount>{total}</Amount>
      <Body onClick={onClick}>{toShortAddress(address)}</Body>
    </Block>
  );
};
