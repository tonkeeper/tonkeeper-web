import { InfiniteData } from '@tanstack/react-query';
import { AccountEvent, AccountEvents } from '@tonkeeper/core/dist/tonApiV2';
import { TronEvent, TronEvents } from '@tonkeeper/core/dist/tronApi';
import { GenericActivity, groupGenericActivity } from './activity';

export interface TronActivity {
    kind: 'tron';
    event: TronEvent;
}

export interface TonActivity {
    kind: 'ton';
    event: AccountEvent;
}

const cutOffTronEvents = (
    tonEvents: InfiniteData<AccountEvents> | undefined,
    tronEvents: InfiniteData<TronEvents>
): InfiniteData<TronEvents> => {
    if (!tonEvents || !tonEvents.pages.length) {
        return tronEvents;
    }

    if (tonEvents.pageParams.length) {
        const pastPageParam = tonEvents.pageParams[tonEvents.pageParams.length - 1];
        if (pastPageParam === undefined || pastPageParam === 0) {
            return tronEvents;
        }
    }

    const { events } = tonEvents.pages[tonEvents.pages.length - 1];
    if (!events.length) return tronEvents;

    const lastEvents = events[events.length - 1];

    const lastTime = lastEvents.timestamp * 1000;

    return {
        pageParams: tronEvents.pageParams,
        pages: tronEvents.pages.map(page => {
            return { ...page, events: page.events.filter(event => event.timestamp > lastTime) };
        })
    };
};

export type MixedActivity = TronActivity | TonActivity;

export const getMixedActivity = (
    tonEvents: InfiniteData<AccountEvents> | undefined,
    tronEvents: InfiniteData<TronEvents> | undefined
) => {
    const activity: GenericActivity<MixedActivity>[] = [];

    if (tonEvents) {
        tonEvents.pages.forEach(page => {
            const tonActivity: GenericActivity<MixedActivity>[] = page.events.map(event => ({
                timestamp: event.timestamp * 1000,
                key: event.eventId,
                event: { kind: 'ton', event }
            }));
            activity.push(...tonActivity);
        });
    }

    if (tronEvents) {
        const events = cutOffTronEvents(tonEvents, tronEvents);
        events.pages.forEach(page => {
            const tronActivity: GenericActivity<MixedActivity>[] = page.events.map(event => ({
                timestamp: event.timestamp,
                key: `${event.txHash}-${event.actions.map(item => item.type).join('-')}`,
                event: { kind: 'tron', event }
            }));
            activity.push(...tronActivity);
        });
    }

    return activity;
};

export const getMixedActivityGroups = (
    tonEvents: InfiniteData<AccountEvents> | undefined,
    tronEvents: InfiniteData<TronEvents> | undefined
) => {
    return groupGenericActivity(getMixedActivity(tonEvents, tronEvents));
};
