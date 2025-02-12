import { FC, Suspense, useCallback } from 'react';
import styled, { css } from 'styled-components';
import { ActivitySkeletonPage } from '../../components/Skeleton';
import { useFetchNext } from '../../hooks/useFetchNext';
import EmptyActivity from '../../components/activity/EmptyActivity';
import {
    DesktopViewHeader,
    DesktopViewHeaderContent,
    DesktopViewPageLayout
} from '../../components/desktop/DesktopViewLayout';
import { DesktopHistory } from '../../components/desktop/history/DesktopHistory';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { useActiveConfig, useActiveWallet } from '../../state/wallet';
import { formatAddress } from '@tonkeeper/core/dist/utils/common';
import { LinkOutIcon, SpinnerRing } from '../../components/Icon';
import { useFetchFilteredActivity, useScrollMonitor } from '../../state/activity';
import {
    AssetHistoryFilter,
    OtherHistoryFilters
} from '../../components/desktop/history/DesktopHistoryFilters';
import { ErrorBoundary } from 'react-error-boundary';
import { fallbackRenderOver } from '../../components/Error';
import { ForTargetEnv, NotForTargetEnv } from '../../components/shared/TargetEnv';
import { Body2 } from '../../components/Text';

const HistoryPageWrapper = styled(DesktopViewPageLayout)`
    ${p =>
        p.theme.proDisplayType === 'desktop' &&
        css`
            overflow: auto;
            min-height: 100%;
        `}
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

const ExplorerButtonMobile = styled.div`
    align-items: center;
    display: flex;
    gap: 6px;
    padding: 0 !important;
    width: 100%;
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

const DesktopViewHeaderContentRightStyled = styled(DesktopViewHeaderContent.Right)`
    margin-left: 0;
    justify-content: space-between;
    width: 100%;

    > *:first-child {
        margin-right: auto;
    }
`;

const DesktopHistoryPageContent: FC = () => {
    const wallet = useActiveWallet();
    const sdk = useAppSdk();
    const config = useActiveConfig();
    const { t } = useTranslation();

    const {
        refetch,
        isFetched: isActivityFetched,
        fetchNextPage: fetchActivityNextPage,
        hasNextPage: hasActivityNextPage,
        isFetchingNextPage: isActivityFetchingNextPage,
        data: activity
    } = useFetchFilteredActivity();

    const setMonitorRef = useScrollMonitor(refetch, 5000);

    const isFetchingNextPage = isActivityFetchingNextPage;

    const setFetchNextRef = useFetchNext(
        hasActivityNextPage,
        isFetchingNextPage,
        fetchActivityNextPage,
        true
    );

    const refCallback = useCallback((el: HTMLDivElement) => {
        setFetchNextRef(el);
        setMonitorRef(el);
    }, []);

    const onOpenExplorer = () =>
        config.accountExplorer
            ? sdk.openPage(config.accountExplorer.replace('%s', formatAddress(wallet.rawAddress)))
            : undefined;

    const rightPart = (
        <>
            <ForTargetEnv env="mobile">
                <DesktopViewHeaderContent.Right>
                    <DesktopViewHeaderContent.RightItem>
                        <ExplorerButtonMobile onClick={onOpenExplorer}>
                            <LinkOutIcon color="currentColor" />
                            <Body2>Tonviewer</Body2>
                        </ExplorerButtonMobile>
                    </DesktopViewHeaderContent.RightItem>
                    <DesktopViewHeaderContent.RightItem>
                        <OtherHistoryFilters />
                    </DesktopViewHeaderContent.RightItem>
                    <DesktopViewHeaderContent.RightItem>
                        <AssetHistoryFilter />
                    </DesktopViewHeaderContent.RightItem>
                </DesktopViewHeaderContent.Right>
            </ForTargetEnv>
            <NotForTargetEnv env="mobile">
                <DesktopViewHeaderContentRightStyled>
                    <DesktopViewHeaderContent.RightItem>
                        <ExplorerButton onClick={onOpenExplorer}>
                            <LinkOutIcon color="currentColor" />
                        </ExplorerButton>
                    </DesktopViewHeaderContent.RightItem>
                    <DesktopViewHeaderContent.RightItem>
                        <AssetHistoryFilter />
                    </DesktopViewHeaderContent.RightItem>
                    <DesktopViewHeaderContent.RightItem>
                        <OtherHistoryFilters />
                    </DesktopViewHeaderContent.RightItem>
                </DesktopViewHeaderContentRightStyled>
            </NotForTargetEnv>
        </>
    );

    if (!isActivityFetched!) {
        return (
            <HistoryPageWrapper>
                <DesktopViewHeader borderBottom={true}>
                    <DesktopViewHeaderContent title={t('page_header_history')} right={rightPart} />
                </DesktopViewHeader>
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
        <HistoryPageWrapper ref={refCallback}>
            <DesktopViewHeader borderBottom={true}>
                <DesktopViewHeaderContent title={t('page_header_history')} right={rightPart} />
            </DesktopViewHeader>
            <HistoryContainer>
                <DesktopHistory activity={activity} isFetchingNextPage={isFetchingNextPage} />
            </HistoryContainer>
        </HistoryPageWrapper>
    );
};
