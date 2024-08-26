import { useMemo } from 'react';
import { getMixedActivity, TonActivity } from '../state/mixedActivity';
import { GenericActivity } from '../state/activity';
import { AccountEvents } from '@tonkeeper/core/dist/tonApiV2';
import { InfiniteData } from '@tanstack/react-query';
import { useWalletPendingEvents } from '../state/realtime';
import { useActiveWallet } from '../state/wallet';
import { PendingOutgoingEvent } from '@tonkeeper/core/dist/entries/send';

export function useMixedActivity(
    tonEvents: InfiniteData<AccountEvents> | undefined,
    pendingOutgoingEvents?: PendingOutgoingEvent[]
) {
    const wallet = useActiveWallet();
    const { data: _pendingOutgoingEvents } = useWalletPendingEvents(wallet.rawAddress);
    const outgoingEvents = pendingOutgoingEvents || _pendingOutgoingEvents;
    return useMemo(() => {
        const mixedActivity = getMixedActivity(tonEvents, undefined);
        const pendingEventsToKeep =
            outgoingEvents?.filter(e =>
                mixedActivity.every(
                    a => a.event.kind === 'ton' && a.event.event.eventId !== e.outgoingMessageId
                )
            ) || [];

        const pendingEventsActivity: GenericActivity<TonActivity>[] = pendingEventsToKeep?.map(
            e => ({
                timestamp: e.creationTimestampMS,
                key: e.outgoingMessageId,
                event: { kind: 'ton', event: e.estimation }
            })
        );

        return [...pendingEventsActivity, ...mixedActivity];
    }, [outgoingEvents, tonEvents]);
}
