import { useInfiniteQuery } from '@tanstack/react-query';
import { TronWalletState } from '@tonkeeper/core/dist/entries/wallet';
import { TronApi, TronBalance } from '@tonkeeper/core/dist/tronApi';
import { formatDecimals } from '@tonkeeper/core/dist/utils/balance';
import React, { FC, useEffect, useMemo, useRef } from 'react';
import { Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { InnerBody } from '../../components/Body';
import {
    CoinHistorySkeleton,
    CoinSkeletonPage,
    HistoryBlock,
    SkeletonList
} from '../../components/Skeleton';
import { SubHeader } from '../../components/SubHeader';
import { TronActivityGroup } from '../../components/activity/tron/TronActivityGroup';
import { ActionsRow } from '../../components/home/Actions';
import { ReceiveAction } from '../../components/home/ReceiveAction';
import { CoinInfo } from '../../components/jettons/Info';
import { SendAction } from '../../components/transfer/SendNotifications';
import { useAppContext } from '../../hooks/appContext';
import { useFetchNext } from '../../hooks/useFetchNext';
import { QueryKey } from '../../libs/queryKey';
import { AppRoute } from '../../libs/routes';
import { useFormatFiat, useRate } from '../../state/rates';
import { useTronBalance, useTronWalletState } from '../../state/tron/tron';
import { getTronActivityGroup } from '../../state/tron/tronActivity';

const TronHeader: FC<{ tronBalance: TronBalance }> = ({ tronBalance: { token, weiAmount } }) => {
    const amount = useMemo(() => formatDecimals(weiAmount, token.decimals), [weiAmount, token]);
    //const balance = useFormatBalance(amount, token.decimals);

    const { data } = useRate(token.symbol);
    const { fiatPrice, fiatAmount } = useFormatFiat(data, amount);

    return (
        <CoinInfo amount={amount} symbol={token.symbol} price={fiatAmount} image={token.image} />
    );
};

const TronActivity: FC<{
    tron: TronWalletState;
    tronBalance: TronBalance;
    innerRef: React.RefObject<HTMLDivElement>;
}> = ({ tron, tronBalance, innerRef }) => {
    const { standalone, tronApi } = useAppContext();
    const { data, isFetched, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteQuery({
        queryKey: [tronBalance.token.address, QueryKey.tron],
        queryFn: ({ pageParam = undefined }) =>
            new TronApi(tronApi).getTransactions({
                ownerAddress: tron.ownerWalletAddress,
                fingerprint: pageParam
            }),
        getNextPageParam: lastPage => lastPage.fingerprint
    });

    useFetchNext(hasNextPage, isFetchingNextPage, fetchNextPage, standalone, innerRef);
    const items = useMemo(() => (data ? getTronActivityGroup(data) : []), [data]);

    if (!isFetched) {
        return <CoinHistorySkeleton />;
    }

    return (
        <HistoryBlock>
            <TronActivityGroup items={items} />
            {isFetchingNextPage && <SkeletonList size={3} />}
        </HistoryBlock>
    );
};

const TronAsset: FC<{ tron: TronWalletState }> = ({ tron }) => {
    const { address } = useParams();
    const navigate = useNavigate();
    const { data: tronBalance, isLoading, isError } = useTronBalance(tron, address);
    useEffect(() => {
        if (isError) {
            navigate(AppRoute.home);
        }
    }, [isError]);

    const ref = useRef<HTMLDivElement>(null);

    if (isLoading || !tronBalance) {
        return <CoinSkeletonPage />;
    }

    return (
        <>
            <SubHeader title={tronBalance.token.name} />
            <InnerBody ref={ref}>
                <TronHeader tronBalance={tronBalance} />
                <ActionsRow>
                    <SendAction asset="TON" />
                    <ReceiveAction />
                </ActionsRow>
                <TronActivity tron={tron} tronBalance={tronBalance} innerRef={ref} />
            </InnerBody>
        </>
    );
};

export const TronPage = () => {
    const navigate = useNavigate();
    const { data: state, isLoading, isError } = useTronWalletState();

    useEffect(() => {
        if (isError) {
            navigate(AppRoute.home);
        }
    }, [isError]);

    if (isLoading || !state) {
        return <CoinSkeletonPage />;
    }

    return (
        <Routes>
            <Route path=":address" element={<TronAsset tron={state} />} />
        </Routes>
    );
};
