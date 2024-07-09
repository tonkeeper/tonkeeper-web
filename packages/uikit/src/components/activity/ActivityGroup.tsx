import { InfiniteData } from '@tanstack/react-query';
import { AccountEvents } from '@tonkeeper/core/dist/tonApiV2';
import { TronEvents } from '@tonkeeper/core/dist/tronApi';
import React, { FC, useMemo, useState } from 'react';
import { GenericActivityGroup } from '../../state/activity';
import { MixedActivity, getMixedActivityGroups } from '../../state/mixedActivity';
import { CoinHistorySkeleton, HistoryBlock, SkeletonListWithImages } from '../Skeleton';
import { ActivityBlock } from './ActivityLayout';
import { ActionData, ActivityNotification } from './ton/ActivityNotification';
import { TonActivityEvents } from './ton/TonActivityEvents';
import { TronActionData, TronActivityNotification } from './tron/ActivityNotification';
import { TronActivityEvents } from './tron/TronActivityEvents';

export const ActivityList: FC<{
    isFetched: boolean;
    isFetchingNextPage: boolean;
    tonEvents?: InfiniteData<AccountEvents>;
    tronEvents?: InfiniteData<TronEvents>;
}> = ({ isFetched, isFetchingNextPage, tonEvents, tronEvents }) => {
    const activity = useMemo<GenericActivityGroup<MixedActivity>[]>(() => {
        return getMixedActivityGroups(tonEvents, tronEvents);
    }, [tonEvents, tronEvents]);

    if (!isFetched) {
        return <CoinHistorySkeleton />;
    }
    return (
        <HistoryBlock>
            <MixedActivityGroup items={activity} />
            {isFetchingNextPage && <SkeletonListWithImages size={3} />}
        </HistoryBlock>
    );
};

export const MixedActivityGroup: FC<{
    items: GenericActivityGroup<MixedActivity>[];
}> = ({ items }) => {
    const [tonAction, seTonAction] = useState<ActionData | undefined>(undefined);
    const [tronAction, setTronAction] = useState<TronActionData | undefined>(undefined);

    return (
        <>
            <ActivityBlock
                groups={items}
                RenderItem={({ event, date, timestamp }) => {
                    if (event.kind === 'tron') {
                        return (
                            <TronActivityEvents
                                event={event.event}
                                date={date}
                                timestamp={timestamp}
                                setTronAction={setTronAction}
                            />
                        );
                    }
                    if (event.kind === 'ton') {
                        return (
                            <TonActivityEvents
                                event={event.event}
                                date={date}
                                timestamp={timestamp}
                                setActivity={seTonAction}
                            />
                        );
                    }
                    return <></>;
                }}
            />
            <ActivityNotification value={tonAction} handleClose={() => seTonAction(undefined)} />
            <TronActivityNotification
                value={tronAction}
                handleClose={() => setTronAction(undefined)}
            />
        </>
    );
};
