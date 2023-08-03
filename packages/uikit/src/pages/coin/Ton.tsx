import { useInfiniteQuery } from '@tanstack/react-query';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { AccountRepr, EventApi } from '@tonkeeper/core/dist/tonApiV1';
import { TonendpointStock } from '@tonkeeper/core/dist/tonkeeperApi/stock';
import { formatDecimals, getTonCoinStockPrice } from '@tonkeeper/core/dist/utils/balance';
import BigNumber from 'bignumber.js';
import React, { useMemo, useRef } from 'react';
import { InnerBody } from '../../components/Body';
import {
    CoinHistorySkeleton,
    CoinSkeletonPage,
    HistoryBlock,
    SkeletonList
} from '../../components/Skeleton';
import { SubHeader } from '../../components/SubHeader';
import { ActivityGroupRaw } from '../../components/activity/ton/TonActivityGroup';
import { HomeActions } from '../../components/home/TonActions';
import { CoinInfo } from '../../components/jettons/Info';
import { useAppContext, useWalletContext } from '../../hooks/appContext';
import { formatFiatCurrency, useFormatCoinValue } from '../../hooks/balance';
import { useTranslation } from '../../hooks/translation';
import { useFetchNext } from '../../hooks/useFetchNext';
import { QueryKey } from '../../libs/queryKey';
import {
    ActivityGroup,
    groupActivity,
    groupAndFilterTonActivityItems
} from '../../state/ton/tonActivity';
import { useTonenpointStock } from '../../state/tonendpoint';
import { useWalletAccountInfo } from '../../state/wallet';

const useBalanceValue = (
    info: AccountRepr | undefined,
    stock: TonendpointStock | undefined,
    fiat: FiatCurrencies
) => {
    return useMemo(() => {
        if (!info || !stock) {
            return formatFiatCurrency(fiat, 0);
        }

        const ton = new BigNumber(info.balance).multipliedBy(
            formatDecimals(getTonCoinStockPrice(stock.today, fiat))
        );
        return formatFiatCurrency(fiat, ton);
    }, [info, stock]);
};

const pageLimit = 20;

export const TonPage = () => {
    const { fiat } = useAppContext();
    const { data: stock } = useTonenpointStock();
    const { data: info } = useWalletAccountInfo();

    const { tonApi, standalone } = useAppContext();
    const wallet = useWalletContext();

    const { fetchNextPage, hasNextPage, isFetchingNextPage, data, isFetched } = useInfiniteQuery({
        queryKey: [wallet.active.rawAddress, QueryKey.activity, 'ton'],
        queryFn: ({ pageParam = undefined }) =>
            new EventApi(tonApi).accountEvents({
                account: wallet.active.rawAddress,
                limit: pageLimit,
                beforeLt: pageParam
            }),
        getNextPageParam: lastPage =>
            lastPage.events.length >= pageLimit ? lastPage.nextFrom : undefined
    });

    const format = useFormatCoinValue();
    const amount = info ? format(info.balance) : '0';

    const ref = useRef<HTMLDivElement>(null);

    const total = useBalanceValue(info, stock, fiat);

    const { t } = useTranslation();

    useFetchNext(hasNextPage, isFetchingNextPage, fetchNextPage, standalone, ref);

    const activity = useMemo<ActivityGroup[]>(() => {
        return data ? groupActivity(groupAndFilterTonActivityItems(data)) : [];
    }, [data]);

    if (!stock || !info) {
        return <CoinSkeletonPage activity={4} />;
    }

    return (
        <>
            <SubHeader title={t('Toncoin')} />
            <InnerBody ref={ref}>
                <CoinInfo
                    amount={amount}
                    symbol="TON"
                    price={total}
                    description={t('Ton_page_description')}
                    image="/img/toncoin.svg"
                />
                <HomeActions />

                {!isFetched ? (
                    <CoinHistorySkeleton />
                ) : (
                    <HistoryBlock>
                        <ActivityGroupRaw items={activity} />
                        {isFetchingNextPage && <SkeletonList size={3} />}
                    </HistoryBlock>
                )}
            </InnerBody>
        </>
    );
};
