import { useInfiniteQuery } from '@tanstack/react-query';
import { AccountsApi } from '@tonkeeper/core/dist/tonApiV2';
import React, { FC, Suspense, useMemo, useRef } from 'react';
import { InnerBody } from '../../components/Body';
import { ActivityHeader } from '../../components/Header';
import { ActivitySkeletonPage, SkeletonListWithImages } from '../../components/Skeleton';
import { MixedActivityGroup } from '../../components/activity/ActivityGroup';

import { useAppContext } from '../../hooks/appContext';
import { useFetchNext } from '../../hooks/useFetchNext';
import { QueryKey } from '../../libs/queryKey';
import { getMixedActivityGroups } from '../../state/mixedActivity';
import { useActiveWallet } from '../../state/wallet';

const EmptyActivity = React.lazy(() => import('../../components/activity/EmptyActivity'));

const Activity: FC = () => {
    const wallet = useActiveWallet();
    const { api, standalone } = useAppContext();

    const ref = useRef<HTMLDivElement>(null);

    const {
        isFetched: isTonFetched,
        fetchNextPage: fetchTonNextPage,
        hasNextPage: hasTonNextPage,
        isFetchingNextPage: isTonFetchingNextPage,
        data: tonEvents
    } = useInfiniteQuery({
        queryKey: [wallet.rawAddress, QueryKey.activity, 'all'],
        queryFn: ({ pageParam = undefined }) =>
            new AccountsApi(api.tonApiV2).getAccountEvents({
                accountId: wallet.rawAddress,
                limit: 20,
                beforeLt: pageParam,
                subjectOnly: true
            }),
        getNextPageParam: lastPage => (lastPage.nextFrom > 0 ? lastPage.nextFrom : undefined)
    });

    // const {
    //     isFetched: isTronFetched,
    //     data: tronEvents,
    //     isFetchingNextPage: isTronFetchingNextPage,
    //     hasNextPage: hasTronNextPage,
    //     fetchNextPage: fetchTronNextPage
    // } = useInfiniteQuery({
    //     queryKey: [wallet.tron?.ownerWalletAddress, wallet.network, QueryKey.tron],
    //     queryFn: ({ pageParam = undefined }) =>
    //         new TronApi(api.tronApi).getTransactions({
    //             ownerAddress: wallet.tron!.ownerWalletAddress,
    //             fingerprint: pageParam,
    //             limit: 100
    //         }),
    //     getNextPageParam: lastPage => lastPage.fingerprint,
    //     enabled: wallet.tron !== undefined
    // });

    const isFetchingNextPage = isTonFetchingNextPage;

    useFetchNext(hasTonNextPage, isFetchingNextPage, fetchTonNextPage, standalone, ref);
    //  useFetchNext(hasTronNextPage, isFetchingNextPage, fetchTronNextPage, standalone, ref);

    const activity = useMemo(() => {
        return getMixedActivityGroups(tonEvents, undefined);
    }, [tonEvents]);

    if (!isTonFetched) {
        return <ActivitySkeletonPage />;
    }

    if (activity.length === 0) {
        return (
            <Suspense fallback={<ActivitySkeletonPage />}>
                <EmptyActivity />
            </Suspense>
        );
    }

    return (
        <>
            <ActivityHeader />
            <InnerBody ref={ref}>
                <MixedActivityGroup items={activity} />
                {isFetchingNextPage && <SkeletonListWithImages size={3} />}
            </InnerBody>
        </>
    );
};

export default Activity;
