import React, { FC, Suspense } from 'react';
import { InnerBody } from '../../components/Body';
import { ActivityHeader } from '../../components/Header';
import { ActivitySkeletonPage, SkeletonListWithImages } from '../../components/Skeleton';

import { useFetchNext } from '../../hooks/useFetchNext';
import { useFetchFilteredActivity, useScrollMonitor } from '../../state/activity';
import { MobileActivityList } from '../../components/activity/MobileActivityList';

const EmptyActivity = React.lazy(() => import('../../components/activity/EmptyActivity'));

const Activity: FC = () => {
    const {
        refetch,
        isFetched: isActivityFetched,
        fetchNextPage: fetchActivityNextPage,
        hasNextPage: hasActivityNextPage,
        isFetchingNextPage: isActivityFetchingNextPage,
        data: activity
    } = useFetchFilteredActivity();

    const setScrollRef = useScrollMonitor(refetch, 5000);

    const isFetchingNextPage = isActivityFetchingNextPage;

    const setSentinelRef = useFetchNext(
        hasActivityNextPage,
        isFetchingNextPage,
        fetchActivityNextPage
    );

    if (!isActivityFetched || !activity) {
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
            <InnerBody ref={setScrollRef}>
                <MobileActivityList items={activity} />
                {isFetchingNextPage && <SkeletonListWithImages size={3} />}
                <div ref={setSentinelRef} />
            </InnerBody>
        </>
    );
};

export default Activity;
