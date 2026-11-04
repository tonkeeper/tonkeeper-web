/**
 * The conversation between the new origin's tab and this origin, opened by it
 * as a popup. `postMessage` is the whole transport because it is the one
 * channel where the browser, not the sender, says who a message is from:
 * `event.origin` can't be forged by page script. Nothing travels in a URL.
 *
 *   popup  → opener   ready                      "I'm loaded, ask me"
 *   opener → popup    request  { nonce, publicKey }
 *   popup  → opener   payload  { payload }       sealed to that request
 *                     none | declined            nothing to send / not now
 *
 * Every message carries the protocol name so that anything else the window
 * receives — an extension, a dev tool, another script — is ignored rather than
 * misread. The wallet's side is `apps/web/src/migration/handoffChannel.ts`,
 * which restates these shapes.
 */

import { HANDOFF_PROTOCOL, HandoffRequest, isWellFormedRequest } from './handoff';

type PopupMessageBody =
    | { type: 'ready' }
    | { type: 'payload'; payload: string }
    | { type: 'none' }
    | { type: 'declined' };

export type PopupMessage = PopupMessageBody & { protocol: typeof HANDOFF_PROTOCOL };

export const popupMessage = (body: PopupMessageBody): PopupMessage => ({
    protocol: HANDOFF_PROTOCOL,
    ...body
});

export interface IncomingMessage {
    origin: string;
    source: unknown;
    data: unknown;
}

/**
 * The request this popup answers, if the message is one. Both checks are the
 * browser's word, not the sender's: the origin is the one the wallet was built
 * for, and the source is the very window that opened this one — a page on the
 * right origin in some other tab is not it.
 */
export const readRequest = (
    event: IncomingMessage,
    expected: { opener: unknown; newOrigin: string }
): HandoffRequest | undefined => {
    if (!expected.opener || event.source !== expected.opener) {
        return undefined;
    }

    if (event.origin !== expected.newOrigin) {
        return undefined;
    }

    const data = event.data as {
        protocol?: unknown;
        type?: unknown;
        nonce?: unknown;
        publicKey?: unknown;
    } | null;

    if (
        data?.protocol !== HANDOFF_PROTOCOL ||
        data.type !== 'request' ||
        typeof data.nonce !== 'string' ||
        typeof data.publicKey !== 'string'
    ) {
        return undefined;
    }

    const request = { nonce: data.nonce, publicKey: data.publicKey };

    return isWellFormedRequest(request) ? request : undefined;
};
