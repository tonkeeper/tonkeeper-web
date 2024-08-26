import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '../hooks/appContext';
import { EventsApi } from '@tonkeeper/core/dist/tonApiV2';
import { useAppSdk } from '../hooks/appSdk';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { anyOfKeysParts, QueryKey } from '../libs/queryKey';
import { useActiveWallet } from './wallet';
import { APIConfig } from '@tonkeeper/core/dist/entries/apis';
import { useEffect, useRef } from 'react';
import { PendingOutgoingEvent } from '@tonkeeper/core/dist/entries/send';

class EventAwaiter {
    constructor(public readonly api: APIConfig, public readonly outgoingMessageId: string) {}

    private readonly maxAttempts = 60;

    private forceStop = false;

    private awaitEventCompletedRec = async (attempt = 0): Promise<boolean> => {
        if (this.forceStop) {
            return false;
        }

        if (attempt > this.maxAttempts) {
            console.error(`Event ${this.outgoingMessageId} not completed in time`);
        }
        try {
            const result = await new EventsApi(this.api.tonApiV2).getEvent({
                eventId: this.outgoingMessageId
            });
            if (!result.inProgress) {
                return true;
            }
        } catch (e) {
            console.error(e);
        }

        await new Promise(r => setTimeout(r, 1500));
        return this.awaitEventCompletedRec(attempt + 1);
    };

    public start = async () => {
        this.forceStop = false;
        return this.awaitEventCompletedRec();
    };

    public stop = () => {
        this.forceStop = true;
    };
}

const useOnPendingEventCompleted = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    return useMutation<void, Error, { walletAddress: string; outgoingMessageId: string }>(
        async ({ walletAddress, outgoingMessageId }) => {
            const events =
                (await sdk.storage.get<PendingOutgoingEvent[]>(
                    AppKey.WALLET_PENDING_EVENTS + walletAddress
                )) || [];

            await sdk.storage.set(
                AppKey.WALLET_PENDING_EVENTS + walletAddress,
                events.filter(e => e.outgoingMessageId !== outgoingMessageId)
            );

            await client.invalidateQueries(
                anyOfKeysParts(walletAddress, QueryKey.walletPendingEvents)
            );
        }
    );
};

export const useProcessPendingEventsBuffer = () => {
    const { api } = useAppContext();
    const activeWallet = useActiveWallet();
    const { data: events } = useWalletPendingEvents(activeWallet.rawAddress);
    const { mutate: onPendingEventCompleted } = useOnPendingEventCompleted();
    const pendingListenersRef = useRef<Record<string, EventAwaiter>>({});

    useEffect(() => {
        if (!events) return;
        const pendingListeners = pendingListenersRef.current;

        for (const key in pendingListeners) {
            if (!events.some(e => e.outgoingMessageId === key)) {
                pendingListeners[key].stop();
                delete pendingListeners[key];
            }
        }

        for (const event of events) {
            if (!pendingListeners[event.outgoingMessageId]) {
                pendingListeners[event.outgoingMessageId] = new EventAwaiter(
                    api,
                    event.outgoingMessageId
                );
                pendingListeners[event.outgoingMessageId].start().then(completed => {
                    if (completed) {
                        onPendingEventCompleted({
                            outgoingMessageId: event.outgoingMessageId,
                            walletAddress: activeWallet.rawAddress
                        });
                    }
                });
            }
        }
    }, [events, activeWallet.rawAddress, onPendingEventCompleted]);
};

export const useWalletPendingEvents = (walletAddress: string) => {
    const { api } = useAppContext();
    const sdk = useAppSdk();
    return useQuery<PendingOutgoingEvent[]>(
        [walletAddress, QueryKey.walletPendingEvents],
        async () => {
            const events =
                (await sdk.storage.get<PendingOutgoingEvent[]>(
                    AppKey.WALLET_PENDING_EVENTS + walletAddress
                )) || [];

            const eventsAPI = new EventsApi(api.tonApiV2);
            const results: { inProgress: boolean }[] = await Promise.all(
                events.map(async e => {
                    try {
                        return await eventsAPI.getEvent({ eventId: e.outgoingMessageId });
                    } catch (err) {
                        return { inProgress: true };
                    }
                })
            );

            const oneDay = 1000 * 60 * 60 * 24;
            const filtered = events.filter(
                (e, index) =>
                    results[index].inProgress && e.creationTimestampMS + oneDay > Date.now()
            );
            if (filtered.length !== events.length) {
                await sdk.storage.set(AppKey.WALLET_PENDING_EVENTS + walletAddress, filtered);
            }

            return filtered;
        }
    );
};

export const useAddWalletPendingEvent = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    return useMutation<void, Error, { walletAddress: string; event: PendingOutgoingEvent }>(
        async ({ walletAddress, event }) => {
            const events =
                (await sdk.storage.get<PendingOutgoingEvent[]>(
                    AppKey.WALLET_PENDING_EVENTS + walletAddress
                )) || [];

            await sdk.storage.set(
                AppKey.WALLET_PENDING_EVENTS + walletAddress,
                events.concat(event)
            );

            await client.invalidateQueries(anyOfKeysParts(QueryKey.walletPendingEvents));
        }
    );
};
