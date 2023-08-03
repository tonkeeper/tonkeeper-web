import { useInfiniteQuery } from '@tanstack/react-query';
import { EventApi } from '@tonkeeper/core/dist/tonApiV1';
import React, { FC, useMemo, useRef } from 'react';
import { InnerBody } from '../../components/Body';
import { ActivityHeader } from '../../components/Header';
import { ActivitySkeletonPage, SkeletonList } from '../../components/Skeleton';
import { EmptyActivity } from '../../components/activity/EmptyActivity';
import { ActivityGroupRaw } from '../../components/activity/ton/ActivityGroup';
import { useAppContext, useWalletContext } from '../../hooks/appContext';
import { useFetchNext } from '../../hooks/useFetchNext';
import { QueryKey } from '../../libs/queryKey';
import { ActivityGroup, groupActivity, groupActivityItems } from '../../state/ton/tonActivity';

const pageLimit = 20;

const Activity: FC = () => {
    const wallet = useWalletContext();
    const { tonApi, standalone } = useAppContext();

    const ref = useRef<HTMLDivElement>(null);

    const { fetchNextPage, hasNextPage, isFetchingNextPage, data } = useInfiniteQuery({
        queryKey: [wallet.active.rawAddress, QueryKey.activity, 'all'],
        queryFn: ({ pageParam = undefined }) =>
            new EventApi(tonApi).accountEvents({
                account: wallet.active.rawAddress,
                limit: pageLimit,
                beforeLt: pageParam
            }),
        getNextPageParam: lastPage =>
            lastPage.events.length >= pageLimit ? lastPage.nextFrom : undefined
    });

    useFetchNext(hasNextPage, isFetchingNextPage, fetchNextPage, standalone, ref);

    const items = useMemo<ActivityGroup[]>(() => {
        return data ? groupActivity(groupActivityItems(data)) : [];
    }, [data]);

    if (!data) {
        return <ActivitySkeletonPage />;
    }

    if (items.length === 0) {
        return <EmptyActivity />;
    }

    return (
        <>
            <ActivityHeader />
            <InnerBody ref={ref}>
                <ActivityGroupRaw items={items} />
                {isFetchingNextPage && <SkeletonList size={3} />}
            </InnerBody>
        </>
    );
};

export default Activity;
