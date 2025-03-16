import { FC, Suspense, useRef } from 'react';
import styled from 'styled-components';
import { ActivitySkeletonPage } from '../../components/Skeleton';
import { useFetchNext } from '../../hooks/useFetchNext';
import EmptyActivity from '../../components/activity/EmptyActivity';
import {
    DesktopViewHeader,
    DesktopViewPageLayout
} from '../../components/desktop/DesktopViewLayout';
import { DesktopHistory } from '../../components/desktop/history/DesktopHistory';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { useActiveConfig, useActiveWallet } from '../../state/wallet';
import { Body2, Label2 } from '../../components/Text';
import { formatAddress } from '@tonkeeper/core/dist/utils/common';
import { LinkOutIcon, SpinnerRing } from '../../components/Icon';
import {
    defaultHistoryFilters,
    useFetchFilteredActivity,
    useHistoryFilters,
    useScrollMonitor
} from '../../state/activity';
import {
    AssetHistoryFilter,
    OtherHistoryFilters
} from '../../components/desktop/history/DesktopHistoryFilters';
import { Button } from '../../components/fields/Button';

const HistoryPageWrapper = styled(DesktopViewPageLayout)`
    overflow: auto;
    min-height: 100%;
`;

const HistoryContainer = styled.div`
    overflow-x: auto;
    overflow-y: hidden;
    min-height: calc(100% - 53px);
`;

const HistoryHeaderContainer = styled(DesktopViewHeader)`
    flex-shrink: 0;
    justify-content: flex-start;
    padding-right: 0;
    > *:last-child {
        margin-left: auto;
    }
`;

const ExplorerButton = styled.button`
    border: none;
    background-color: transparent;
    padding: 10px 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    color: ${p => p.theme.iconTertiary};
    transition: color 0.15s ease-in-out;
    &:hover {
        color: ${p => p.theme.textAccent};
    }
`;

const FiltersWrapper = styled.div`
    display: flex;
`;

const LoaderContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 150px;

    > * {
        transform: scale(1.5);
    }
`;

const ClearFiltersContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
    justify-content: center;
    height: 100%;
`;

const EmptyHistoryContainer = styled.div`
    height: calc(100% - 53px);
`;

const Body2Secondary = styled(Body2)`
    color: ${p => p.theme.textSecondary};
`;

export const DesktopHistoryPage: FC = () => {
    const wallet = useActiveWallet();
    const sdk = useAppSdk();
    const config = useActiveConfig();
    const { t } = useTranslation();

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

    useFetchNext(hasActivityNextPage, isFetchingNextPage, fetchActivityNextPage, true, ref);

    const onOpenExplorer = () =>
        config.accountExplorer
            ? sdk.openPage(config.accountExplorer.replace('%s', formatAddress(wallet.rawAddress)))
            : undefined;

    const {
        asset: assetFilter,
        filterSpam,
        onlyInitiator: onlyInitiatorFilter,
        setFilters
    } = useHistoryFilters();

    if (!isActivityFetched!) {
        return (
            <HistoryPageWrapper>
                <HistoryHeaderContainer borderBottom={false}>
                    <Label2>{t('page_header_history')}</Label2>
                    <ExplorerButton onClick={onOpenExplorer}>
                        <LinkOutIcon color="currentColor" />
                    </ExplorerButton>
                    <FiltersWrapper>
                        <AssetHistoryFilter />
                        <OtherHistoryFilters />
                    </FiltersWrapper>
                </HistoryHeaderContainer>
                <HistoryContainer>
                    <LoaderContainer>
                        <SpinnerRing />
                    </LoaderContainer>
                </HistoryContainer>
            </HistoryPageWrapper>
        );
    }

    if (activity?.length === 0) {
        if (
            assetFilter !== defaultHistoryFilters.asset ||
            onlyInitiatorFilter !== defaultHistoryFilters.onlyInitiator ||
            filterSpam !== defaultHistoryFilters.filterSpam
        ) {
            return (
                <HistoryPageWrapper>
                    <HistoryHeaderContainer borderBottom>
                        <Label2>{t('page_header_history')}</Label2>
                        <ExplorerButton onClick={onOpenExplorer}>
                            <LinkOutIcon color="currentColor" />
                        </ExplorerButton>
                        <FiltersWrapper>
                            <AssetHistoryFilter />
                            <OtherHistoryFilters />
                        </FiltersWrapper>
                    </HistoryHeaderContainer>
                    <EmptyHistoryContainer>
                        <ClearFiltersContent>
                            <Label2>{t('activity_empty_reset_filters_title')}</Label2>
                            <Body2Secondary>
                                {t('activity_empty_reset_filters_description')}
                            </Body2Secondary>
                            <Button secondary onClick={() => setFilters(defaultHistoryFilters)}>
                                {t('activity_empty_reset_filters_button')}
                            </Button>
                        </ClearFiltersContent>
                    </EmptyHistoryContainer>
                </HistoryPageWrapper>
            );
        }
        return (
            <Suspense fallback={<ActivitySkeletonPage />}>
                <EmptyActivity />
            </Suspense>
        );
    }

    return (
        <HistoryPageWrapper ref={ref}>
            <HistoryHeaderContainer borderBottom={true}>
                <Label2>{t('page_header_history')}</Label2>
                <ExplorerButton onClick={onOpenExplorer}>
                    <LinkOutIcon color="currentColor" />
                </ExplorerButton>
                <FiltersWrapper>
                    <AssetHistoryFilter />
                    <OtherHistoryFilters />
                </FiltersWrapper>
            </HistoryHeaderContainer>
            <HistoryContainer>
                <DesktopHistory activity={activity} isFetchingNextPage={isFetchingNextPage} />
            </HistoryContainer>
        </HistoryPageWrapper>
    );
};
