import { useInfiniteQuery } from '@tanstack/react-query';
import {
  JettonApi,
  JettonBalance,
  JettonInfo,
} from '@tonkeeper/core/dist/tonApi';
import {
  getJettonStockAmount,
  getJettonStockPrice,
} from '@tonkeeper/core/dist/utils/balance';
import React, { FC, useMemo } from 'react';
import { ActivityGroupRaw } from '../../components/activity/ActivityGroup';
import { ActionsRow } from '../../components/home/Actions';
import { ReceiveAction } from '../../components/home/ReceiveAction';
import { CoinInfo } from '../../components/jettons/Info';
import {
  CoinHistorySkeleton,
  CoinSkeleton,
  HistoryBlock,
} from '../../components/Skeleton';
import { SubHeader } from '../../components/SubHeader';
import { SendAction } from '../../components/transfer/SendNotifications';
import { useAppContext, useWalletContext } from '../../hooks/appContext';
import { formatFiatCurrency, useFormatCoinValue } from '../../hooks/balance';
import { useTranslation } from '../../hooks/translation';
import { JettonKey, QueryKey } from '../../libs/queryKey';
import {
  ActivityGroup,
  groupActivity,
  groupAndFilterJettonActivityItems,
} from '../../state/activity';
import { useJettonBalance, useJettonInfo } from '../../state/jetton';
import { useTonenpointStock } from '../../state/tonendpoint';

const JettonHistory: FC<{ info: JettonInfo; balance: JettonBalance }> = ({
  balance,
}) => {
  const { tonApi } = useAppContext();
  const wallet = useWalletContext();

  const { fetchNextPage, hasNextPage, isFetchingNextPage, data } =
    useInfiniteQuery({
      queryKey: [
        balance.walletAddress.address,
        QueryKey.activity,
        JettonKey.history,
      ],
      queryFn: ({ pageParam = undefined }) =>
        new JettonApi(tonApi).getJettonHistory({
          account: wallet.active.rawAddress,
          jettonMaster: balance.walletAddress.address,
          limit: 200,
          // beforeLt: pageParam,
        }),
      getNextPageParam: (lastPage) => lastPage.nextFrom,
    });

  const items = useMemo<ActivityGroup[]>(() => {
    return data
      ? groupActivity(
          groupAndFilterJettonActivityItems(data, wallet.active.rawAddress)
        )
      : [];
  }, [data, wallet.active.rawAddress]);

  if (items.length === 0) {
    return <CoinHistorySkeleton />;
  }

  return (
    <HistoryBlock>
      <ActivityGroupRaw items={items} />
    </HistoryBlock>
  );
};

export const JettonContent: FC<{ jettonAddress: string }> = ({
  jettonAddress,
}) => {
  const { t } = useTranslation();
  const { fiat } = useAppContext();
  const { data: info } = useJettonInfo(jettonAddress);
  const { data: balance } = useJettonBalance(jettonAddress);
  const { data: stock } = useTonenpointStock();

  const format = useFormatCoinValue();

  const [price, total] = useMemo(() => {
    if (!stock || !balance) return [undefined, undefined] as const;
    const price = getJettonStockPrice(balance, stock.today, fiat);
    if (!price) return [undefined, undefined] as const;
    const amount = getJettonStockAmount(balance, price);
    return [
      formatFiatCurrency(fiat, price),
      amount ? formatFiatCurrency(fiat, amount) : undefined,
    ];
  }, [balance, stock, fiat]);

  if (!info || !balance || !stock) {
    return <CoinSkeleton />;
  }

  console.log(info);
  const { description, image, name } = info.metadata;
  return (
    <div>
      <SubHeader title={name} />
      <CoinInfo
        amount={format(balance.balance, info.metadata.decimals)}
        symbol={info.metadata.symbol}
        price={total}
        description={description}
        image={image}
      />
      <ActionsRow>
        <SendAction asset={info.metadata.address} />
        <ReceiveAction info={info} />
      </ActionsRow>

      <JettonHistory info={info} balance={balance} />
    </div>
  );
};
