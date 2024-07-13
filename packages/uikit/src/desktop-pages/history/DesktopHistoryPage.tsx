import { useInfiniteQuery } from '@tanstack/react-query';
import { AccountsApi } from '@tonkeeper/core/dist/tonApiV2';
import { FC, Suspense, useMemo, useRef } from 'react';
import styled from 'styled-components';
import { ActivitySkeletonPage } from '../../components/Skeleton';
import { Body2, Label2 } from '../../components/Text';
import EmptyActivity from '../../components/activity/EmptyActivity';
import {
    DesktopViewHeader,
    DesktopViewPageLayout
} from '../../components/desktop/DesktopViewLayout';
import { DesktopHistory } from '../../components/desktop/history/DesktopHistory';
import { useAppContext, useWalletContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { useFetchNext } from '../../hooks/useFetchNext';
import { useIsScrolled } from '../../hooks/useIsScrolled';
import { mergeRefs } from '../../libs/common';
import { QueryKey } from '../../libs/queryKey';
import { getMixedActivity } from '../../state/mixedActivity';

const HistoryPageWrapper = styled(DesktopViewPageLayout)`
    overflow: auto;
`;

const HistoryContainer = styled.div`
    overflow-x: auto;
`;

const HistoryHeaderContainer = styled(DesktopViewHeader)`
    flex-shrink: 0;
    justify-content: space-between;
    border-bottom: 1px solid ${p => p.theme.separatorCommon};
    padding-right: 0;
`;

const ExplorerButton = styled.button`
    border: none;
    background-color: transparent;
    padding: 0.5rem 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    color: ${p => p.theme.textAccent};
`;

export const DesktopHistoryPage: FC = () => {
    const wallet = useWalletContext();
    const sdk = useAppSdk();
    const { api, standalone, config } = useAppContext();
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
            <HistoryHeaderContainer borderBottom={!closeTop}>
                <Label2>{t('page_header_history')}</Label2>
                <ExplorerButton
                    onClick={() =>
                        config.accountExplorer
                            ? sdk.openPage(
                                  config.accountExplorer.replace(
                                      '%s',
                                      wallet.active.friendlyAddress
                                  )
                              )
                            : undefined
                    }
                >
                    <Body2>{t('nft_view_in_explorer')}</Body2>
                </ExplorerButton>
            </HistoryHeaderContainer>
            <HistoryContainer>
                <DesktopHistory activity={activity} isFetchingNextPage={isFetchingNextPage} />
            </HistoryContainer>
        </HistoryPageWrapper>
    );
};
