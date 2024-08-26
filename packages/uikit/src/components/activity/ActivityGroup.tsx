import { InfiniteData } from '@tanstack/react-query';
import { AccountEvents } from '@tonkeeper/core/dist/tonApiV2';
import React, { FC, useMemo, useState } from 'react';
import {
    formatActivityDate,
    GenericActivityGroup,
    getActivityTitle,
    groupGenericActivity
} from '../../state/activity';
import { MixedActivity } from '../../state/mixedActivity';
import { CoinHistorySkeleton, HistoryBlock, SkeletonListWithImages } from '../Skeleton';
import { Group, List, Title } from './ActivityLayout';
import { ActionData, ActivityNotification } from './ton/ActivityNotification';
import { TonActivityEvents } from './ton/TonActivityEvents';
import { TronActionData, TronActivityNotification } from './tron/ActivityNotification';
import { TronActivityEvents } from './tron/TronActivityEvents';
import { useTranslation } from '../../hooks/translation';
import { useActiveWallet } from '../../state/wallet';
import { useWalletPendingEvents } from '../../state/realtime';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { useMixedActivity } from '../../hooks/useMixedActivity';

export const ActivityList: FC<{
    isFetched: boolean;
    isFetchingNextPage: boolean;
    forAsset: string;
    tonEvents?: InfiniteData<AccountEvents>;
}> = ({ isFetched, isFetchingNextPage, tonEvents, forAsset }) => {
    const wallet = useActiveWallet();
    const { data: pendingOutgoingEvents } = useWalletPendingEvents(wallet.rawAddress);
    const tokenPendingEvents = useMemo(
        () =>
            pendingOutgoingEvents?.filter(e => {
                if (forAsset === 'ton') {
                    return e.affectAssetAddress === TON_ASSET.id;
                } else {
                    return e.affectAssetAddress === forAsset;
                }
            }),
        [pendingOutgoingEvents, forAsset]
    );
    const activity = useMixedActivity(tonEvents, tokenPendingEvents);
    const groups = useMemo(() => groupGenericActivity(activity), [activity]);

    if (!isFetched) {
        return <CoinHistorySkeleton />;
    }
    return (
        <HistoryBlock>
            <MixedActivityGroup items={groups} />
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
