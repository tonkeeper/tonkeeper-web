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
        tronEvents.pages.forEach(page => {
            const tronActivity: GenericActivity<MixedActivity>[] = page.events.map(event => ({
                timestamp: event.timestamp,
                key: event.txHash,
                event: { kind: 'tron', event }
            }));
            activity.push(...tronActivity);
        });
    }

    return groupGenericActivity(activity);
};
