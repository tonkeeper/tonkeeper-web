import React, { FC, Suspense, useRef } from 'react';
import { InnerBody } from '../../components/Body';
import { ActivityHeader } from '../../components/Header';
import { ActivitySkeletonPage, SkeletonListWithImages } from '../../components/Skeleton';

import { useAppContext } from '../../hooks/appContext';
import { useFetchNext } from '../../hooks/useFetchNext';
import { useFetchFilteredActivity, useScrollMonitor } from '../../state/activity';
import { MobileActivityList } from '../../components/activity/MobileActivityList';

const EmptyActivity = React.lazy(() => import('../../components/activity/EmptyActivity'));

const Activity: FC = () => {
    const { standalone } = useAppContext();

    const ref = useRef<HTMLDivElement>(null);

    const {
        refetch,
        isFetched: isActivityFetched,
        fetchNextPage: fetchActivityNextPage,
        hasNextPage: hasActivityNextPage,
        isFetchingNextPage: isActivityFetchingNextPage,
        data: activity
    } = useFetchFilteredActivity();

    useScrollMonitor(ref, 5000, refetch);

    const isFetchingNextPage = isActivityFetchingNextPage;

    useFetchNext(hasActivityNextPage, isFetchingNextPage, fetchActivityNextPage, standalone, ref);

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
            <InnerBody ref={ref}>
                <MobileActivityList items={activity} />
                {isFetchingNextPage && <SkeletonListWithImages size={3} />}
            </InnerBody>
        </>
    );
};

export default Activity;
