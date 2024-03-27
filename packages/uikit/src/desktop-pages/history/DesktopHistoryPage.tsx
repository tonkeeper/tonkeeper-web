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
import {
    DesktopViewHeader,
    DesktopViewPageLayout
} from '../../components/desktop/DesktopViewLayout';
import { useTranslation } from '../../hooks/translation';
import { DesktopHistory } from '../../components/desktop/history/DesktopHistory';
import { useIsScrolled } from '../../hooks/useIsScrolled';
import { mergeRefs } from '../../libs/common';

const HistoryPageWrapper = styled(DesktopViewPageLayout)`
    overflow: auto;
`;

export const DesktopHistoryPage: FC = () => {
    const wallet = useWalletContext();
    const { api, standalone } = useAppContext();
    const { t } = useTranslation();

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

    const { ref: scrollRef, closeTop } = useIsScrolled();

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
        <HistoryPageWrapper ref={mergeRefs(ref, scrollRef)}>
            <DesktopViewHeader borderBottom={!closeTop}>
                <Label2>{t('page_header_history')}</Label2>
            </DesktopViewHeader>
            <DesktopHistory activity={activity} isFetchingNextPage={isFetchingNextPage} />
        </HistoryPageWrapper>
    );
};
