import { useInfiniteQuery } from '@tanstack/react-query';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { AccountRepr } from '@tonkeeper/core/dist/tonApiV1';
import { AccountsApi } from '@tonkeeper/core/dist/tonApiV2';
import { TonendpointStock } from '@tonkeeper/core/dist/tonkeeperApi/stock';
import { formatDecimals, getTonCoinStockPrice } from '@tonkeeper/core/dist/utils/balance';
import BigNumber from 'bignumber.js';
import React, { useMemo, useRef } from 'react';
import { InnerBody } from '../../components/Body';
import { CoinSkeletonPage } from '../../components/Skeleton';
import { SubHeader } from '../../components/SubHeader';
import { ActivityList } from '../../components/activity/ActivityGroup';
import { HomeActions } from '../../components/home/TonActions';
import { CoinInfo } from '../../components/jettons/Info';
import { useAppContext, useWalletContext } from '../../hooks/appContext';
import { formatFiatCurrency, useFormatCoinValue } from '../../hooks/balance';
import { useTranslation } from '../../hooks/translation';
import { useFetchNext } from '../../hooks/useFetchNext';
import { QueryKey } from '../../libs/queryKey';
import { groupAndFilterTonActivityItems } from '../../state/ton/tonActivity';
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

export const TonPage = () => {
    const { fiat } = useAppContext();
    const { data: stock } = useTonenpointStock();
    const { data: info } = useWalletAccountInfo();

    const { tonApiV2, standalone } = useAppContext();
    const wallet = useWalletContext();

    const { fetchNextPage, hasNextPage, isFetchingNextPage, data, isFetched } = useInfiniteQuery({
        queryKey: [wallet.active.rawAddress, QueryKey.activity, 'ton'],
        queryFn: ({ pageParam = undefined }) =>
            new AccountsApi(tonApiV2).getAccountEvents({
                accountId: wallet.active.rawAddress,
                limit: 20,
                beforeLt: pageParam
            }),
        getNextPageParam: lastPage => (lastPage.nextFrom > 0 ? lastPage.nextFrom : undefined)
    });

    const format = useFormatCoinValue();
    const amount = info ? format(info.balance) : '0';

    const ref = useRef<HTMLDivElement>(null);

    const total = useBalanceValue(info, stock, fiat);

    const { t } = useTranslation();

    useFetchNext(hasNextPage, isFetchingNextPage, fetchNextPage, standalone, ref);

    const activity = useMemo(() => {
        return data ? groupAndFilterTonActivityItems(data) : undefined;
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

                <ActivityList
                    isFetched={isFetched}
                    isFetchingNextPage={isFetchingNextPage}
                    tonEvents={activity}
                />
            </InnerBody>
        </>
    );
};
