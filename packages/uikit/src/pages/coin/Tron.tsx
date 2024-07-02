import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { TronWalletState } from '@tonkeeper/core/dist/entries/wallet';
import { TronBalance } from '@tonkeeper/core/dist/tronApi';
import { formatDecimals } from '@tonkeeper/core/dist/utils/balance';
import React, { FC, useEffect, useMemo, useRef } from 'react';
import { Route, Routes, useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { InnerBody } from '../../components/Body';
import { CoinSkeletonPage } from '../../components/Skeleton';
import { SubHeader } from '../../components/SubHeader';
import { Body2 } from '../../components/Text';
import { ActionsRow } from '../../components/home/Actions';
import { ReceiveAction } from '../../components/home/ReceiveAction';
import { CoinInfo } from '../../components/jettons/Info';
import { SendAction } from '../../components/transfer/SendActionButton';
import { useFormatBalance } from '../../hooks/balance';
import { AppRoute } from '../../libs/routes';
import { useFormatFiat, useRate } from '../../state/rates';
import { useTronBalance, useTronWalletState } from '../../state/tron/tron';

const TronHeader: FC<{ tronBalance: TronBalance }> = ({ tronBalance: { token, weiAmount } }) => {
    const amount = useMemo(() => formatDecimals(weiAmount, token.decimals), [weiAmount, token]);
    const total = useFormatBalance(amount, token.decimals);

    const { data } = useRate(token.symbol);
    const { fiatAmount } = useFormatFiat(data, amount);

    return <CoinInfo amount={total} symbol={token.symbol} price={fiatAmount} image={token.image} />;
};

const TronActivity: FC<{
    tron: TronWalletState;
    innerRef: React.RefObject<HTMLDivElement>;
}> = ({ tron, innerRef }) => {
    return null;
    /*const {
        standalone,
        api: { tronApi }
    } = useAppContext();
    const { data, isFetched, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteQuery({
        queryKey: [tron.ownerWalletAddress, wallet.network, QueryKey.tron],
        queryFn: ({ pageParam = undefined }) =>
            new TronApi(tronApi).getTransactions({
                ownerAddress: tron.ownerWalletAddress,
                fingerprint: pageParam,
                limit: 100
            }),
        getNextPageParam: lastPage => lastPage.fingerprint
    });

    useFetchNext(hasNextPage, isFetchingNextPage, fetchNextPage, standalone, innerRef);

    return (
        <ActivityList
            isFetched={isFetched}
            isFetchingNextPage={isFetchingNextPage}
            tronEvents={data}
        />
    );*/
};

const Layout = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    line-height: 22px;
`;

const Label = styled(Body2)`
    color: ${props => props.theme.textSecondary};
`;

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
            <SubHeader
                title={
                    <Layout>
                        <div>{tronBalance.token.name}</div>
                        <Label>TRC20</Label>
                    </Layout>
                }
            />
            <InnerBody ref={ref}>
                <TronHeader tronBalance={tronBalance} />
                <ActionsRow>
                    <SendAction asset="TON" chain={BLOCKCHAIN_NAME.TRON} />
                    <ReceiveAction chain={BLOCKCHAIN_NAME.TRON} />
                </ActionsRow>
                <TronActivity tron={tron} innerRef={ref} />
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
