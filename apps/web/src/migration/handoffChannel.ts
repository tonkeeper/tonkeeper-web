import { OLD_ORIGIN } from './config';
import { HandoffEntries, OpenedHandoff, openHandoff } from './handoffOpen';
import { createHandoffRequest } from './handoffRequest';

/**
 * This tab's half of the conversation with the old origin, which it opens as a
 * popup. The other half, and the message shapes, are in
 * `apps/migration/src/channel.ts`.
 *
 * Every message is accepted on the browser's word alone: `event.source` must
 * be the window this tab opened and `event.origin` the pinned old origin.
 * Anything else — another tab, a page on some other origin, a script that
 * learned the request — is ignored, which is what makes a payload from anyone
 * but the old origin impossible rather than merely noticeable.
 */

const HANDOFF_PROTOCOL = 'tk-migration-v1';

/** Mirrors `HANDOFF_POPUP_PATH` in the old origin's routing. */
const POPUP_URL = `${OLD_ORIGIN}/handoff`;
const POPUP_NAME = 'tk-migration-handoff';
const POPUP_FEATURES = 'popup,width=480,height=720';

const CLOSED_POLL_MS = 500;

export type HandoffOutcome =
    | { kind: 'payload'; entries: HandoffEntries }
    | { kind: 'none' }
    | { kind: 'declined' }
    /** The popup was closed, or cancelled from here, before it answered. */
    | { kind: 'closed' }
    /** The browser refused to open it. */
    | { kind: 'blocked' }
    | { kind: 'rejected'; reason: Exclude<OpenedHandoff, { ok: true }>['reason'] };

export interface PopupWindow {
    readonly closed: boolean;
    postMessage: (message: unknown, targetOrigin: string) => void;
    close: () => void;
}

export interface IncomingMessage {
    origin: string;
    source: unknown;
    data: unknown;
}

export interface PopupEnvironment {
    open: (url: string) => PopupWindow | null;
    listen: (handler: (event: IncomingMessage) => void) => () => void;
    every: (ms: number, tick: () => void) => () => void;
}

const browserEnvironment: PopupEnvironment = {
    open: url => window.open(url, POPUP_NAME, POPUP_FEATURES),
    listen: handler => {
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    },
    every: (ms, tick) => {
        const id = window.setInterval(tick, ms);
        return () => window.clearInterval(id);
    }
};

export interface HandoffSession {
    outcome: Promise<HandoffOutcome>;
    cancel: () => void;
}

/**
 * Opens the popup and runs the exchange to its end. Call it straight from a
 * click: the popup opens before anything is awaited, so the browser still
 * counts it as the person's own action. The key pair is made while the popup
 * loads, and the listener is in place before the popup exists, so its first
 * message can't be missed.
 */
export const startHandoffPopup = (env: PopupEnvironment = browserEnvironment): HandoffSession => {
    const requested = createHandoffRequest();
    let popup: PopupWindow | null = null;
    let answered = false;
    let settle: (outcome: HandoffOutcome) => void = () => undefined;
    const outcome = new Promise<HandoffOutcome>(resolve => (settle = resolve));

    const stopListening = env.listen(event => {
        if (answered || !popup || event.source !== popup || event.origin !== OLD_ORIGIN) {
            return;
        }

        const data = event.data as { protocol?: unknown; type?: unknown; payload?: unknown } | null;

        if (data?.protocol !== HANDOFF_PROTOCOL) {
            return;
        }

        switch (data.type) {
            case 'ready':
                // Repeated if the popup reloads: the same request each time, so
                // one popup can only ever answer one key.
                requested.then(({ request }) =>
                    popup?.postMessage(
                        { protocol: HANDOFF_PROTOCOL, type: 'request', ...request },
                        OLD_ORIGIN
                    )
                );
                return;
            case 'none':
            case 'declined':
                finish({ kind: data.type });
                return;
            case 'payload':
                if (typeof data.payload !== 'string') {
                    return;
                }

                // Spent on the first payload, whatever it turns out to hold.
                answered = true;
                requested
                    .then(({ pending }) =>
                        openHandoff({ payload: data.payload as string, pending })
                    )
                    .then(
                        opened =>
                            finish(
                                opened.ok
                                    ? { kind: 'payload', entries: opened.entries }
                                    : { kind: 'rejected', reason: opened.reason }
                            ),
                        () => finish({ kind: 'rejected', reason: 'decrypt' })
                    );
                return;
        }
    });

    let stopPolling: () => void = () => undefined;
    let finished = false;

    const finish = (result: HandoffOutcome) => {
        if (finished) {
            return;
        }

        finished = true;
        stopListening();
        stopPolling();
        settle(result);
    };

    requested.catch(() => finish({ kind: 'rejected', reason: 'no-request' }));

    popup = env.open(POPUP_URL);

    if (!popup) {
        finish({ kind: 'blocked' });
    } else {
        stopPolling = env.every(CLOSED_POLL_MS, () => {
            if (popup?.closed && !answered) {
                finish({ kind: 'closed' });
            }
        });
    }

    return {
        outcome,
        cancel: () => {
            popup?.close();
            if (!answered) {
                finish({ kind: 'closed' });
            }
        }
    };
};
