import React, { FC, Suspense } from 'react';
import { InnerBody } from '../../components/Body';
import { ActivityHeader } from '../../components/Header';
import { ActivitySkeletonPage, SkeletonListWithImages } from '../../components/Skeleton';

import { useAppContext } from '../../hooks/appContext';
import { useFetchNext } from '../../hooks/useFetchNext';
import { useFetchFilteredActivity, useScrollMonitor } from '../../state/activity';
import { MobileActivityList } from '../../components/activity/MobileActivityList';
import { mergeRefs } from '../../libs/common';

const EmptyActivity = React.lazy(() => import('../../components/activity/EmptyActivity'));

const Activity: FC = () => {
    const { standalone } = useAppContext();

    const {
        refetch,
        isFetched: isActivityFetched,
        fetchNextPage: fetchActivityNextPage,
        hasNextPage: hasActivityNextPage,
        isFetchingNextPage: isActivityFetchingNextPage,
        data: activity
    } = useFetchFilteredActivity();

    const scrollRef = useScrollMonitor(refetch, 5000);

    const isFetchingNextPage = isActivityFetchingNextPage;

    const fetchNextRef = useFetchNext(
        hasActivityNextPage,
        isFetchingNextPage,
        fetchActivityNextPage,
        standalone
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
            <InnerBody ref={mergeRefs<HTMLDivElement>(scrollRef, fetchNextRef)}>
                <MobileActivityList items={activity} />
                {isFetchingNextPage && <SkeletonListWithImages size={3} />}
            </InnerBody>
        </>
    );
};

export default Activity;
