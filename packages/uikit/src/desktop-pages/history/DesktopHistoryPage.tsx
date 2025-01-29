import { FC, Suspense, useRef } from 'react';
import styled, { css } from 'styled-components';
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
import { Label2 } from '../../components/Text';
import { formatAddress } from '@tonkeeper/core/dist/utils/common';
import { LinkOutIcon, SpinnerRing } from '../../components/Icon';
import { useFetchFilteredActivity, useScrollMonitor } from '../../state/activity';
import {
    AssetHistoryFilter,
    OtherHistoryFilters
} from '../../components/desktop/history/DesktopHistoryFilters';
import { ErrorBoundary } from 'react-error-boundary';
import { fallbackRenderOver } from '../../components/Error';

const HistoryPageWrapper = styled(DesktopViewPageLayout)`
    overflow: auto;
    min-height: 100%;
`;

const HistoryContainer = styled.div`
    min-height: calc(100% - 53px);

    ${p =>
        p.theme.proDisplayType === 'desktop' &&
        css`
            overflow-x: auto;
            overflow-y: hidden;
        `}
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

export const DesktopHistoryPage = () => {
    return (
        <ErrorBoundary fallbackRender={fallbackRenderOver('Failed to display history page')}>
            <DesktopHistoryPageContent />
        </ErrorBoundary>
    );
};

const DesktopViewPageLayoutStyled = styled(DesktopViewPageLayout)`
    height: 100%;

    > * {
        height: 100%;
    }
`;

const DesktopHistoryPageContent: FC = () => {
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
        return (
            <Suspense fallback={<ActivitySkeletonPage />}>
                <DesktopViewPageLayoutStyled>
                    <EmptyActivity />
                </DesktopViewPageLayoutStyled>
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
