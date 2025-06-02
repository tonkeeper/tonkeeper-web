import { ReadonlySubject, subject } from '@tonkeeper/core/dist/entries/atom';

declare global {
    interface Window {
        webkit?: {
            messageHandlers?: {
                browserMessages?: {
                    postMessage: (message: { queryId: string; payload: string }) => void;
                };
            };
        };
    }
}

type BridgeMessage = {
    queryId?: string;
    payload: string;
};

type BridgeMessageParsed = {
    queryId: string;
    payload: unknown;
};

type BridgeEvent = Event & {
    detail: BridgeMessage;
};

let queryIdCounter = 0;

export function postBridgeMessage<T>(payload: unknown): Promise<T> {
    return new Promise(resolve => {
        queryIdCounter = queryIdCounter + 1;
        const queryId = queryIdCounter.toString();

        messages$.subscribe(m => {
            if (m.queryId === queryId) {
                resolve(m.payload as T);
            }
        });

        window.webkit?.messageHandlers?.browserMessages?.postMessage({
            queryId,
            payload: JSON.stringify(payload)
        });
    });
}

const messages$ = subject<BridgeMessageParsed>();
const events$ = subject<unknown>();
export const bridgeEvents$ = events$ as ReadonlySubject<unknown>;

window.addEventListener('mainMessageReceived', event => {
    const { queryId, payload: rawPayload } = (event as BridgeEvent).detail;
    const payload = JSON.parse(rawPayload);

    if (queryId) {
        messages$.next({
            queryId,
            payload
        });
    } else {
        events$.next(payload);
    }
});
