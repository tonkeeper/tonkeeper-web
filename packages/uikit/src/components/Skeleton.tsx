import React, { FC, useEffect } from 'react';
import styled from 'styled-components';
import { useAppSdk } from '../hooks/appSdk';
import { InnerBody } from './Body';
import { ActivityHeader, BrowserHeader, SettingsHeader } from './Header';
import { ActionsRow } from './home/Actions';
import { BalanceSkeleton } from './home/Balance';
import { CoinInfoSkeleton } from './jettons/Info';
import { ColumnText } from './Layout';
import { ListBlock, ListItem, ListItemPayload } from './List';
import { SubHeader } from './SubHeader';
import { H3 } from './Text';
import { SkeletonImage, SkeletonText } from './shared/Skeleton';
import { randomIntFromInterval } from '../libs/common';
import { RecommendationsPageBodySkeleton } from './skeletons/BrowserSkeletons';

export const SkeletonSubHeader = React.memo(() => {
    return <SubHeader title={<SkeletonText size="large" />} />;
});

const ActionBlock = styled.div`
    width: 65px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
`;

export const SkeletonAction = React.memo(() => {
    return (
        <ActionBlock>
            <SkeletonImage />
            <SkeletonText size="small" width="50px" />
        </ActionBlock>
    );
});

const ListItemBlock = styled.div`
    display: flex;
    gap: 0.5rem;
    width: 100%;
`;

export const SkeletonListPayloadWithImage = React.memo(() => {
    return (
        <ListItemPayload>
            <ListItemBlock>
                <SkeletonImage />
                <ColumnText
                    text={<SkeletonText width={randomIntFromInterval(30, 300) + 'px'} />}
                    secondary={<SkeletonText size="small" width="40px" />}
                ></ColumnText>
            </ListItemBlock>
        </ListItemPayload>
    );
});

export const SkeletonListWithImages: FC<{
    size?: number;
    margin?: boolean;
    fullWidth?: boolean;
}> = React.memo(({ size = 1, margin, fullWidth }) => {
    return (
        <ListBlock margin={margin} fullWidth={fullWidth}>
            {Array(size)
                .fill(null)
                .map((_, index) => (
                    <ListItem key={index} hover={false}>
                        <SkeletonListPayloadWithImage />
                    </ListItem>
                ))}
        </ListBlock>
    );
});

export const SkeletonListPayload = React.memo(() => {
    return (
        <ListItemPayload>
            <ListItemBlock>
                <ColumnText
                    text={<SkeletonText width={randomIntFromInterval(30, 300) + 'px'} />}
                    secondary={<SkeletonText size="small" width="40px" />}
                ></ColumnText>
            </ListItemBlock>
        </ListItemPayload>
    );
});

export const SkeletonList: FC<{
    size?: number;
    margin?: boolean;
    fullWidth?: boolean;
    className?: string;
}> = React.memo(({ size = 1, margin, fullWidth, className }) => {
    return (
        <ListBlock margin={margin} fullWidth={fullWidth} className={className}>
            {Array(size)
                .fill(null)
                .map((_, index) => (
                    <ListItem key={index} hover={false}>
                        <SkeletonListPayload />
                    </ListItem>
                ))}
        </ListBlock>
    );
});

const SkeletonSettingsList: FC<{ size?: number }> = React.memo(({ size = 1 }) => {
    return (
        <ListBlock>
            {Array(size)
                .fill(null)
                .map((_, index) => (
                    <ListItem key={index} hover={false}>
                        <ListItemPayload>
                            <SkeletonText
                                size="large"
                                width={randomIntFromInterval(30, 300) + 'px'}
                            />
                            <SkeletonText size="large" width="30px" />
                        </ListItemPayload>
                    </ListItem>
                ))}
        </ListBlock>
    );
});

const ActivityList = styled.div`
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
`;

const Title = styled(H3)`
    margin: 0 0 0.875rem;
`;

export const ActivitySkeletonPage = React.memo(() => {
    return (
        <>
            <ActivityHeader />
            <InnerBody>
                <Title>
                    <SkeletonText size="large" />
                </Title>
                <ActivityList>
                    <SkeletonListWithImages size={1} margin={false} />
                    <SkeletonListWithImages size={3} margin={false} />
                    <SkeletonListWithImages size={2} margin={false} />
                    <SkeletonListWithImages size={4} margin={false} />
                </ActivityList>
            </InnerBody>
        </>
    );
});

export const SettingsSkeletonPage = React.memo(() => {
    return (
        <>
            <SettingsHeader />
            <InnerBody>
                <ActivityList>
                    <SkeletonSettingsList size={2} />
                    <SkeletonSettingsList size={4} />
                    <SkeletonSettingsList size={3} />
                    <SkeletonSettingsList size={6} />
                </ActivityList>
            </InnerBody>
        </>
    );
});

export const BrowserSkeletonPage = React.memo(() => {
    return (
        <>
            <BrowserHeader />
            <InnerBody>
                <RecommendationsPageBodySkeleton />
            </InnerBody>
        </>
    );
});

export const HistoryBlock = styled.div`
    margin-top: 3rem;
`;

export const CoinHistorySkeleton = React.memo(() => {
    const sdk = useAppSdk();
    useEffect(() => {
        return () => {
            sdk.uiEvents.emit('loading');
        };
    }, []);

    return (
        <HistoryBlock>
            <Title>
                <SkeletonText size="large" />
            </Title>
            <SkeletonListWithImages size={3} />
        </HistoryBlock>
    );
});

export const CoinSkeletonPage: FC<{ activity?: number }> = React.memo(({ activity = 2 }) => {
    return (
        <>
            <SkeletonSubHeader />
            <InnerBody>
                <CoinInfoSkeleton />
                <ActionsRow>
                    {Array(activity)
                        .fill(null)
                        .map((_, index) => (
                            <SkeletonAction key={index} />
                        ))}
                </ActionsRow>

                <CoinHistorySkeleton />
            </InnerBody>
        </>
    );
});

export const HomeSkeleton = React.memo(() => {
    const sdk = useAppSdk();
    useEffect(() => {
        return () => {
            sdk.uiEvents.emit('loading');
        };
    }, []);

    return (
        <>
            <BalanceSkeleton />
            <ActionsRow>
                <SkeletonAction />
                <SkeletonAction />
                <SkeletonAction />
                {/* <SkeletonAction /> */}
            </ActionsRow>
            <SkeletonListWithImages size={5} />
        </>
    );
});
