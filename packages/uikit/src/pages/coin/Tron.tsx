import { TronWalletState } from '@tonkeeper/core/dist/entries/wallet';
import React, { FC, useEffect, useRef } from 'react';
import { Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { InnerBody } from '../../components/Body';
import { CoinSkeletonPage } from '../../components/Skeleton';
import { SubHeader } from '../../components/SubHeader';
import { ActionsRow } from '../../components/home/Actions';
import { ReceiveAction } from '../../components/home/ReceiveAction';
import { CoinInfo } from '../../components/jettons/Info';
import { SendAction } from '../../components/transfer/SendNotifications';
import { useFormatCoinValue } from '../../hooks/balance';
import { AppRoute } from '../../libs/routes';
import { useTronBalance, useTronWalletState } from '../../state/tron';

const TronAsset: FC<{ tron: TronWalletState }> = ({ tron }) => {
    const { address } = useParams();
    const navigate = useNavigate();
    const { data: balance, isLoading, isError } = useTronBalance(tron, address);
    const format = useFormatCoinValue();
    useEffect(() => {
        if (isError) {
            navigate(AppRoute.home);
        }
    }, [isError]);

    console.log(tron);

    const ref = useRef<HTMLDivElement>(null);

    if (isLoading || !balance) {
        return <CoinSkeletonPage />;
    }

    const { token, weiAmount } = balance;

    return (
        <>
            <SubHeader title={token.name} />
            <InnerBody ref={ref}>
                <CoinInfo
                    amount={format(weiAmount, token.decimals)}
                    symbol={token.symbol}
                    //   price={'0'}
                    image={token.image}
                />
                <ActionsRow>
                    <SendAction asset="TON" />
                    <ReceiveAction />
                </ActionsRow>

                {/* 
              {!isFetched ? (
                <CoinHistorySkeleton />
              ) : (
                <HistoryBlock>
                  <ActivityGroupRaw items={activity} />
                  {isFetchingNextPage && <SkeletonList size={3} />}
                </HistoryBlock>
              )} */}
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
