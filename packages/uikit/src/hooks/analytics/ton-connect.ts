import { createContext, useContext, useEffect, useMemo } from 'react';
import { isUserCancellation } from '@tonkeeper/core/dist/errors/UserCancelledError';
import {
    RedErrorType,
    RedMetadata,
    toRedError,
    toRedOutcome,
    useRedOperation
} from './red-operation';

/**
 * `injected` — the dApp runs in this app or browser and talks to the wallet
 * directly; `http` — it reaches the wallet over the TON Connect bridge.
 */
export type TonConnectConnectionType = 'injected' | 'http';

export type TonConnectAnalyticsRequest = {
    connectionType: TonConnectConnectionType;
    dappUrl: string | undefined;
};

const CONNECT_STAGE = 'connect_wallet';
const CONFIRM_STAGE = 'confirm';
const SEND_STAGE = 'send';

const attemptSourceOf = (connectionType: TonConnectConnectionType) =>
    connectionType === 'injected' ? 'tonconnect_local' : 'tonconnect_remote';

const hostOf = (url: string | undefined): string | undefined => {
    if (!url) return undefined;
    try {
        return new URL(url).hostname;
    } catch {
        return url;
    }
};

const requestMetadata = (request: TonConnectAnalyticsRequest): RedMetadata => ({
    dapp_host: hostOf(request.dappUrl),
    connection_type: request.connectionType
});

/**
 * RED operation for approving a TON Connect connection. The attempt opens when
 * the user taps Connect, not when the sheet appears — dismissing an untouched
 * sheet emits nothing. Unmounting with the attempt still open reports a cancel.
 */
export const useTonConnectConnectOperation = (request: TonConnectAnalyticsRequest | null) => {
    const red = useRedOperation();
    const { finish } = red;

    useEffect(() => () => finish('cancel', { stage: CONNECT_STAGE }), [finish]);

    return useMemo(
        () => ({
            start: () => {
                if (!request) return;
                red.start({
                    flow: 'ton_connect',
                    operation: 'connect_wallet',
                    attemptSource: attemptSourceOf(request.connectionType),
                    metadata: requestMetadata(request)
                });
            },
            succeed: () => red.finish('success', { stage: CONNECT_STAGE }),
            fail: (error: unknown) =>
                red.finish(toRedOutcome(error), {
                    stage: CONNECT_STAGE,
                    error: toRedError(error, 'ton_connect_session_interrupted')
                }),
            cancel: () => red.finish('cancel', { stage: CONNECT_STAGE })
        }),
        [red, request]
    );
};

const TonConnectRequestAnalyticsContext = createContext<TonConnectAnalyticsRequest | null>(null);

/**
 * Marks the confirmation sheets below as answering a TON Connect request.
 * The same sheets also serve in-app flows (staking, multisig), which stay
 * outside any provider and emit no `ton_connect` operation.
 */
export const TonConnectRequestAnalyticsProvider = TonConnectRequestAnalyticsContext.Provider;

/**
 * RED operation for confirming a TON Connect `sendTransaction` or `signData`
 * request. The attempt opens on Confirm; backing out of the unlock prompt ends
 * it as a cancel at `confirm` and leaves the sheet ready for a fresh attempt.
 * Unmounting with the attempt still open reports a cancel.
 */
export const useTonConnectConfirmOperation = (kind: 'sendTransaction' | 'signData') => {
    const request = useContext(TonConnectRequestAnalyticsContext);
    const red = useRedOperation();
    const { finish } = red;

    useEffect(() => () => finish('cancel', { stage: CONFIRM_STAGE }), [finish]);

    return useMemo(() => {
        const errorType: RedErrorType =
            kind === 'signData' ? 'sign_request_failed' : 'transaction_send_failed';
        return {
            start: () => {
                if (!request) return;
                red.start({
                    flow: 'ton_connect',
                    operation: 'confirm_transaction',
                    attemptSource: attemptSourceOf(request.connectionType),
                    metadata: {
                        ...requestMetadata(request),
                        dapp_url: kind === 'signData' ? request.dappUrl : undefined
                    }
                });
            },
            succeed: () => red.finish('success', { stage: SEND_STAGE }),
            fail: (error: unknown) =>
                red.finish(toRedOutcome(error), {
                    stage: isUserCancellation(error) ? CONFIRM_STAGE : SEND_STAGE,
                    error: toRedError(error, errorType)
                })
        };
    }, [red, request, kind]);
};
