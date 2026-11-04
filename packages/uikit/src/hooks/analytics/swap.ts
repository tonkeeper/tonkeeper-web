import { useEffect, useMemo, useRef } from 'react';

import { AnalyticsEvent } from '@tonkeeper/core/dist/analytics';
import {
    AnalyticsAssetId,
    normalizeAnalyticsAssetId
} from '@tonkeeper/core/dist/analytics/asset-id';
import { toWalletMode } from '@tonkeeper/core/dist/analytics/wallet-mapping';
import { canonicalAssetId } from '@tonkeeper/core/dist/service/chainkit/multichainSwapService';

import { useActiveAccount } from '../../state/wallet';
import { AnalyticsTracker } from './common';
import { useAnalyticsTrack } from './index';
import {
    RedError,
    RedErrorType,
    RedMetadata,
    RedSession,
    startRedOperation,
    toRedError,
    toRedOutcome
} from './red-operation';

type SwapConfirmEvent = Extract<AnalyticsEvent, { eventName: 'swap_confirm' }>;

export type SwapFeeAsset = SwapConfirmEvent['fee_asset'];

/** What every swap funnel event after `swap_open` carries. */
export interface SwapAnalyticsPair {
    asset_from: AnalyticsAssetId;
    asset_to: AnalyticsAssetId;
    is_max?: boolean;
}

/** What the funnel learns once a route and a fee method are picked. */
export interface SwapAnalyticsRoute extends SwapAnalyticsPair {
    fee_asset: SwapFeeAsset;
    provider_name: string;
}

/**
 * A swaps-backend asset id in the form analytics joins on. The id is put in
 * the backends' canonical spelling first, so an id the client assembled with
 * a checksummed or friendly address reports the same as the catalog's.
 */
export const toSwapAnalyticsAssetId = (assetId: string): AnalyticsAssetId =>
    normalizeAnalyticsAssetId(canonicalAssetId(assetId));

export const useSwapAnalytics = () => {
    const track = useAnalyticsTrack();
    const account = useActiveAccount();

    return useMemo(() => {
        const base = { type: 'native', wallet_mode: toWalletMode(account) } as const;
        return {
            open: () => track({ eventName: 'swap_open', ...base }),
            click: (pair: SwapAnalyticsPair) =>
                track({ eventName: 'swap_click', ...base, ...pair }),
            confirm: (route: SwapAnalyticsRoute) =>
                track({ eventName: 'swap_confirm', ...base, ...route }),
            success: (route: SwapAnalyticsRoute) =>
                track({ eventName: 'swap_success', ...base, ...route }),
            failed: (route: SwapAnalyticsRoute, error: unknown) =>
                track({
                    eventName: 'swap_failed',
                    ...base,
                    ...route,
                    error_message: toRedError(error, 'transaction_send_failed').message
                })
        };
    }, [track, account]);
};

/**
 * `swap_open` each time the swap screen is shown. The emitter is read through
 * a ref so an account or tracker change while the screen is up doesn't count
 * as another open.
 */
export const useTrackSwapOpen = (isOpen: boolean) => {
    const { open } = useSwapAnalytics();
    const openRef = useRef(open);
    openRef.current = open;

    useEffect(() => {
        if (isOpen) openRef.current();
    }, [isOpen]);
};

export const startSwapRedOperation = (
    track: AnalyticsTracker,
    operation: 'quote' | 'emulate' | 'send',
    metadata?: RedMetadata
): RedSession =>
    startRedOperation(track, { flow: 'swap', operation, attemptSource: 'native_ui', metadata });

/**
 * Closes a swap `send` operation the way the native apps do: a user backing
 * out of the unlock prompt is a `cancel` at the confirm stage, anything else
 * a send-stage failure.
 */
export const finishSwapSendWithError = (session: RedSession, error: unknown) => {
    const outcome = toRedOutcome(error);
    session.finish(
        outcome,
        outcome === 'cancel'
            ? { stage: 'confirm' }
            : { stage: 'send', error: toRedError(error, 'transaction_send_failed') }
    );
};

/**
 * Runs a request-backed swap step (`quote` / `emulate`) as one RED operation.
 * Passing the react-query `signal` turns a request the screen stopped waiting
 * for — superseded by new input, or the screen closed — into a `cancel`.
 * Reading it also lets react-query drop such a request instead of caching it.
 * `failureOf` reports a resolved answer that the screen treats as a failure.
 */
export const runSwapRedOperation = async <T>(
    track: AnalyticsTracker,
    params: {
        operation: 'quote' | 'emulate';
        errorType: RedErrorType;
        signal?: AbortSignal;
        metadata?: RedMetadata;
        failureOf?: (result: T) => RedError | undefined;
    },
    run: () => Promise<T>
): Promise<T> => {
    const { operation, signal } = params;
    const session = startSwapRedOperation(track, operation, params.metadata);
    const onAbort = () => session.finish('cancel', { stage: operation });
    if (signal?.aborted) onAbort();
    signal?.addEventListener('abort', onAbort, { once: true });
    try {
        const result = await run();
        const failure = params.failureOf?.(result);
        session.finish(failure ? 'fail' : 'success', { stage: operation, error: failure });
        return result;
    } catch (e) {
        session.finish(toRedOutcome(e), {
            stage: operation,
            error: toRedError(e, params.errorType)
        });
        throw e;
    } finally {
        signal?.removeEventListener('abort', onAbort);
    }
};
