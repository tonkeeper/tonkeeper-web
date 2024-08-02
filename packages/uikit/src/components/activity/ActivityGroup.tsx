import { InfiniteData } from '@tanstack/react-query';
import { AccountEvents } from '@tonkeeper/core/dist/tonApiV2';
import { TronEvents } from '@tonkeeper/core/dist/tronApi';
import React, { FC, useMemo, useState } from 'react';
import { formatActivityDate, GenericActivityGroup, getActivityTitle } from '../../state/activity';
import { MixedActivity, getMixedActivityGroups } from '../../state/mixedActivity';
import { CoinHistorySkeleton, HistoryBlock, SkeletonListWithImages } from '../Skeleton';
import { Group, List, Title } from './ActivityLayout';
import { ActionData, ActivityNotification } from './ton/ActivityNotification';
import { TonActivityEvents } from './ton/TonActivityEvents';
import { TronActionData, TronActivityNotification } from './tron/ActivityNotification';
import { TronActivityEvents } from './tron/TronActivityEvents';
import { useTranslation } from '../../hooks/translation';

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
    const { i18n } = useTranslation();

    return (
        <>
            {items.map(([eventKey, events]) => {
                return (
                    <Group key={eventKey}>
                        <Title>
                            {getActivityTitle(i18n.language, eventKey, events[0].timestamp)}
                        </Title>
                        {events.map(({ timestamp, event, key }) => {
                            const date = formatActivityDate(i18n.language, eventKey, timestamp);
                            return (
                                <List key={key}>
                                    {event.kind === 'tron' ? (
                                        <TronActivityEvents
                                            event={event.event}
                                            date={date}
                                            timestamp={timestamp}
                                            setTronAction={setTronAction}
                                        />
                                    ) : event.kind === 'ton' ? (
                                        <TonActivityEvents
                                            event={event.event}
                                            date={date}
                                            timestamp={timestamp}
                                            setActivity={seTonAction}
                                        />
                                    ) : null}
                                </List>
                            );
                        })}
                    </Group>
                );
            })}
            <ActivityNotification value={tonAction} handleClose={() => seTonAction(undefined)} />
            <TronActivityNotification
                value={tronAction}
                handleClose={() => setTronAction(undefined)}
            />
        </>
    );
};
