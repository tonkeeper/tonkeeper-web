import { useInfiniteQuery } from '@tanstack/react-query';
import { AccountsApi } from '@tonkeeper/core/dist/tonApiV2';
import React, { FC, Suspense, useMemo, useRef } from 'react';
import { ActivitySkeletonPage } from '../../components/Skeleton';

import { useAppContext, useWalletContext } from '../../hooks/appContext';
import { useFetchNext } from '../../hooks/useFetchNext';
import { QueryKey } from '../../libs/queryKey';
import { getMixedActivity } from '../../state/mixedActivity';
import EmptyActivity from '../../components/activity/EmptyActivity';
import styled from 'styled-components';
import { Label2 } from '../../components/Text';
import { HistoryEvent } from '../../components/desktop/history/HistoryEvent';
import { SpinnerRing } from '../../components/Icon';

const HistoryHeader = styled.div`
    padding: 0.5rem 1rem;
`;

const HistoryPageWrapper = styled.div`
    overflow: auto;
`;

const HistoryEventsGrid = styled.div<{ withBorder?: boolean }>`
    display: grid;
    grid-template-columns: 124px fit-content(256px) fit-content(256px) minmax(40px, 1fr);
    column-gap: 8px;
    padding: 0 1rem;
`;

const GridSizer = styled.div`
    height: 0;
`;

const GridSizer2 = styled.div`
    height: 0;
    min-width: 120px;
`;

const GridSizer3 = styled.div`
    height: 0;
    min-width: 120px;
`;

const FetchingRows = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 36px;

    > div {
        transform: scale(1.25);
    }
`;

export const DesktopHistory: FC = () => {
    const wallet = useWalletContext();
    const { api, standalone } = useAppContext();

    const ref = useRef<HTMLDivElement>(null);

    const {
        isFetched: isTonFetched,
        fetchNextPage: fetchTonNextPage,
        hasNextPage: hasTonNextPage,
        isFetchingNextPage: isTonFetchingNextPage,
        data: tonEvents
    } = useInfiniteQuery({
        queryKey: [wallet.active.rawAddress, QueryKey.activity, 'all'],
        queryFn: ({ pageParam = undefined }) =>
            new AccountsApi(api.tonApiV2).getAccountEvents({
                accountId: wallet.active.rawAddress,
                limit: 20,
                beforeLt: pageParam,
                subjectOnly: true
            }),
        getNextPageParam: lastPage => (lastPage.nextFrom > 0 ? lastPage.nextFrom : undefined)
    });

    const isFetchingNextPage = isTonFetchingNextPage;

    useFetchNext(hasTonNextPage, isFetchingNextPage, fetchTonNextPage, standalone, ref);

    const activity = useMemo(() => {
        return getMixedActivity(tonEvents, undefined);
    }, [tonEvents]);

    if (!isTonFetched) {
        return null;
    }

    if (activity.length === 0) {
        return (
            <Suspense fallback={<ActivitySkeletonPage />}>
                <EmptyActivity />
            </Suspense>
        );
    }

    return (
        <HistoryPageWrapper ref={ref}>
            <HistoryHeader>
                <Label2>History</Label2>
            </HistoryHeader>
            <HistoryEventsGrid>
                <GridSizer />
                <GridSizer2 />
                <GridSizer3 />
                <GridSizer />
                {activity.map(item => (
                    <HistoryEvent item={item} key={item.key} />
                ))}
            </HistoryEventsGrid>
            {isFetchingNextPage && (
                <FetchingRows>
                    <SpinnerRing />
                </FetchingRows>
            )}
        </HistoryPageWrapper>
    );
};
