import { useCallback, useMemo, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AnalyticsEvent } from '@tonkeeper/core/dist/analytics';
import { isUserCancellation } from '@tonkeeper/core/dist/errors/UserCancelledError';
import { NotEnoughBalanceError } from '@tonkeeper/core/dist/errors/NotEnoughBalanceError';
import { useAnalyticsTrack } from './index';
import { AnalyticsTracker } from './common';

type OpAttemptEvent = Extract<AnalyticsEvent, { eventName: 'op_attempt' }>;
type OpTerminalEvent = Extract<AnalyticsEvent, { eventName: 'op_terminal' }>;

export type RedFlow = OpAttemptEvent['flow'];
export type RedOperation = OpAttemptEvent['operation'];
export type RedOutcome = OpTerminalEvent['outcome'];

/**
 * `walletconnect` extends the native apps' vocabulary: WalletConnect requests
 * have no TON Connect local/remote split, mirroring `send_open.from`.
 */
export type RedAttemptSource =
    | 'native_ui'
    | 'tonconnect_local'
    | 'tonconnect_remote'
    | 'walletconnect';

/** Error categories shared with iOS, so op_terminal groups across platforms. */
export type RedErrorType =
    | 'fee_calculation_failed'
    | 'insufficient_funds'
    | 'native_swap'
    | 'network'
    | 'sign_failed'
    | 'transaction_send_failed'
    | 'transfer_failed'
    | 'connection'
    | 'ton_connect_session_interrupted'
    | 'sign_request_failed';

export type RedMetadata = Record<string, string | number | boolean | null | undefined>;

export type RedError = { type: RedErrorType; message: string; code?: number };

export type RedFinishOptions = {
    error?: RedError;
    stage?: string;
    metadata?: RedMetadata;
};

export type RedSession = {
    finish: (outcome: RedOutcome, options?: RedFinishOptions) => void;
};

const toMetadataJson = (metadata: RedMetadata | undefined): string | undefined => {
    if (!metadata) return undefined;
    const entries = Object.entries(metadata).filter(([, value]) => value != null);
    if (entries.length === 0) return undefined;
    return JSON.stringify(Object.fromEntries(entries.sort(([a], [b]) => a.localeCompare(b))));
};

const errorCode = (error: unknown): number | undefined => {
    if (typeof error !== 'object' || error === null) return undefined;
    const candidate = (error as { status?: unknown }).status ?? (error as { code?: unknown }).code;
    return typeof candidate === 'number' && Number.isFinite(candidate) ? candidate : undefined;
};

export const toRedError = (error: unknown, fallbackType: RedErrorType): RedError => {
    const message =
        error instanceof Error
            ? error.message
            : typeof error === 'string'
            ? error
            : 'Unknown error';
    const type = error instanceof NotEnoughBalanceError ? 'insufficient_funds' : fallbackType;
    return { type, message, code: errorCode(error) };
};

/** `cancel` when the user backed out of a security prompt, `fail` otherwise. */
export const toRedOutcome = (error: unknown): Exclude<RedOutcome, 'success'> =>
    isUserCancellation(error) ? 'cancel' : 'fail';

/**
 * Emits `op_attempt` now and returns a handle whose `finish` emits the matching
 * `op_terminal` exactly once; later calls are ignored.
 */
export const startRedOperation = (
    track: AnalyticsTracker,
    params: {
        flow: RedFlow;
        operation: RedOperation;
        attemptSource?: RedAttemptSource;
        metadata?: RedMetadata;
    }
): RedSession => {
    const operationId = uuidv4();
    const startedAt = Date.now();

    track({
        eventName: 'op_attempt',
        operation_id: operationId,
        flow: params.flow,
        operation: params.operation,
        attempt_source: params.attemptSource,
        started_at_ms: startedAt,
        other_metadata: toMetadataJson(params.metadata)
    });

    let finished = false;
    return {
        finish: (outcome, options = {}) => {
            if (finished) return;
            finished = true;
            const finishedAt = Date.now();
            const error = outcome === 'fail' ? options.error : undefined;
            track({
                eventName: 'op_terminal',
                operation_id: operationId,
                flow: params.flow,
                operation: params.operation,
                outcome,
                duration_ms: finishedAt - startedAt,
                finished_at_ms: finishedAt,
                error_code: error?.code,
                error_message: error?.message,
                error_type: error?.type,
                stage: options.stage,
                other_metadata: toMetadataJson(options.metadata)
            });
        }
    };
};

/**
 * One RED operation at a time per component. `start` while a session is still
 * open is ignored, matching the native session holders.
 */
export const useRedOperation = () => {
    const track = useAnalyticsTrack();
    const session = useRef<RedSession | null>(null);

    const start = useCallback(
        (params: Parameters<typeof startRedOperation>[1]) => {
            if (session.current) return;
            session.current = startRedOperation(track, params);
        },
        [track]
    );

    const finish = useCallback((outcome: RedOutcome, options?: RedFinishOptions) => {
        session.current?.finish(outcome, options);
        session.current = null;
    }, []);

    return useMemo(() => ({ start, finish }), [start, finish]);
};
