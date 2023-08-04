import { useInfiniteQuery } from '@tanstack/react-query';
import { AccountsApi } from '@tonkeeper/core/dist/tonApiV2';
import React, { FC, useMemo, useRef } from 'react';
import { InnerBody } from '../../components/Body';
import { ActivityHeader } from '../../components/Header';
import { ActivitySkeletonPage, SkeletonList } from '../../components/Skeleton';
import { MixedActivityGroup } from '../../components/activity/ActivityGroup';
import { EmptyActivity } from '../../components/activity/EmptyActivity';
import { useAppContext, useWalletContext } from '../../hooks/appContext';
import { useFetchNext } from '../../hooks/useFetchNext';
import { QueryKey } from '../../libs/queryKey';
import { getMixedActivity } from '../../state/mixedActivity';

const pageLimit = 20;

const Activity: FC = () => {
    const wallet = useWalletContext();
    const { tonApiV2, standalone } = useAppContext();

    const ref = useRef<HTMLDivElement>(null);

    const { fetchNextPage, hasNextPage, isFetchingNextPage, data } = useInfiniteQuery({
        queryKey: [wallet.active.rawAddress, QueryKey.activity, 'all'],
        queryFn: ({ pageParam = undefined }) =>
            new AccountsApi(tonApiV2).getEventsByAccount({
                accountId: wallet.active.rawAddress,
                limit: pageLimit,
                beforeLt: pageParam
            }),
        getNextPageParam: lastPage =>
            lastPage.events.length >= pageLimit ? lastPage.nextFrom : undefined
    });

    useFetchNext(hasNextPage, isFetchingNextPage, fetchNextPage, standalone, ref);

    const activity = useMemo(() => {
        return data ? getMixedActivity(data, undefined) : [];
    }, [data]);

    if (!data) {
        return <ActivitySkeletonPage />;
    }

    if (activity.length === 0) {
        return <EmptyActivity />;
    }

    return (
        <>
            <ActivityHeader />
            <InnerBody ref={ref}>
                <MixedActivityGroup items={activity} />
                {isFetchingNextPage && <SkeletonList size={3} />}
            </InnerBody>
        </>
    );
};

export default Activity;
