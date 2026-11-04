import { useCallback, useEffect, useMemo, useRef } from 'react';

import { TransferInitParams } from '@tonkeeper/core/dist/AppSdk';
import { AnalyticsEvent } from '@tonkeeper/core/dist/analytics';
import {
    AnalyticsAssetId,
    normalizeAnalyticsAssetId
} from '@tonkeeper/core/dist/analytics/asset-id';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';

import { useAnalyticsTrack } from './index';
import { toAnalyticsAmount, TransferInitiatedBy, useAnalyticsAssetId } from './events-hooks';
import type { RampSource } from './ramp-flow';
import {
    RedAttemptSource,
    RedMetadata,
    toRedError,
    toRedOutcome,
    useRedOperation
} from './red-operation';

type SendConfirmEvent = Extract<AnalyticsEvent, { eventName: 'send_confirm' }>;

export type SendFrom = SendConfirmEvent['from'];
export type SendFeeAsset = SendConfirmEvent['fee_asset'];

/** What every send funnel event after `send_open` carries. */
export interface SendAnalyticsContext {
    from: SendFrom;
    asset: AnalyticsAssetId;
    /** Human-readable amount the user entered. */
    amount: number;
    /** Catalog id of the dapp that requested the send; only for `tonconnect_local`. */
    appId?: string;
}

export const rampSourceToSendFrom = (from: RampSource): SendFrom => {
    switch (from) {
        case 'jetton_screen':
        case 'deep_link':
        case 'qr_code':
        case 'walletconnect':
            return from;
        default:
            return 'wallet_screen';
    }
};

/** `transaction_sent.initiated_by` for a multichain send opened from `from`. */
export const rampSourceToInitiatedBy = (from: RampSource): TransferInitiatedBy =>
    from === 'deep_link' || from === 'qr_code' ? from : 'user';

/** `send_open.from` for a legacy `transfer` uiEvent. */
export const transferSendFrom = (params: TransferInitParams): SendFrom =>
    params.origin ?? (params.from === 'token' ? 'jetton_screen' : 'wallet_screen');

export const toMultichainSendContext = (params: {
    from: RampSource;
    assetId: string;
    amount: bigint;
    decimals: number;
}): SendAnalyticsContext => ({
    from: rampSourceToSendFrom(params.from),
    asset: normalizeAnalyticsAssetId(params.assetId),
    amount: toAnalyticsAmount(params.amount, params.decimals)
});

export const useAssetAmountSendContext = (
    from: SendFrom | undefined,
    amount: AssetAmount
): SendAnalyticsContext | undefined => {
    const assetId = useAnalyticsAssetId();
    return useMemo(
        () =>
            from && {
                from,
                asset: assetId.fromAsset(amount.asset),
                amount: amount.relativeAmount.toNumber()
            },
        [from, amount, assetId]
    );
};

const toRedAttemptSource = (from: SendFrom): RedAttemptSource => {
    switch (from) {
        case 'tonconnect_local':
        case 'tonconnect_remote':
        case 'walletconnect':
            return from;
        default:
            return 'native_ui';
    }
};

const toRedMetadata = (context: SendAnalyticsContext, feePaidIn?: SendFeeAsset): RedMetadata => ({
    source: context.from,
    asset: context.asset,
    amount: context.amount,
    fee_paid_in: feePaidIn,
    app_id: context.appId
});

/**
 * The `transfer` / `emulate` operation of a confirm screen: one attempt per
 * fee estimation, cancelled when the screen goes away before the estimate
 * lands. Without a context nothing is reported.
 */
export const useSendEmulationAnalytics = ({
    context,
    active,
    pending,
    failed,
    error
}: {
    context: SendAnalyticsContext | undefined;
    active: boolean;
    pending: boolean;
    failed: boolean;
    error?: unknown;
}) => {
    const { start, finish } = useRedOperation();
    const contextRef = useRef(context);
    contextRef.current = context;
    const errorRef = useRef(error);
    errorRef.current = error;

    useEffect(() => {
        if (!active) {
            finish('cancel', { stage: 'emulate' });
            return;
        }
        if (pending) {
            const current = contextRef.current;
            if (current) {
                start({
                    flow: 'transfer',
                    operation: 'emulate',
                    attemptSource: toRedAttemptSource(current.from),
                    metadata: toRedMetadata(current)
                });
            }
            return;
        }
        if (failed) {
            finish('fail', {
                error: toRedError(
                    errorRef.current ?? new Error('Failed to calculate fee'),
                    'fee_calculation_failed'
                ),
                stage: 'emulate'
            });
        } else {
            finish('success', { stage: 'emulate' });
        }
    }, [active, pending, failed, start, finish]);

    useEffect(() => () => finish('cancel', { stage: 'emulate' }), [finish]);
};

/**
 * `send_confirm` → `send_success` / `send_failed`, bracketed by the
 * `transfer` / `send` operation. `confirm` snapshots the context, so a result
 * is reported against what the user actually confirmed. A user who backs out
 * of the unlock prompt cancels the operation without a `send_failed`.
 */
export const useSendAnalytics = (context: SendAnalyticsContext | undefined) => {
    const track = useAnalyticsTrack();
    const { start, finish } = useRedOperation();
    const attempt = useRef<{ context: SendAnalyticsContext; feeAsset: SendFeeAsset } | null>(null);

    const confirm = useCallback(
        (feeAsset: SendFeeAsset) => {
            if (!context) return;
            attempt.current = { context, feeAsset };
            start({
                flow: 'transfer',
                operation: 'send',
                attemptSource: toRedAttemptSource(context.from),
                metadata: toRedMetadata(context, feeAsset)
            });
            track({
                eventName: 'send_confirm',
                from: context.from,
                asset: context.asset,
                amount: context.amount,
                fee_asset: feeAsset,
                app_id: context.appId
            });
        },
        [context, start, track]
    );

    const succeed = useCallback(() => {
        const current = attempt.current;
        if (!current) return;
        attempt.current = null;
        finish('success', { stage: 'send' });
        track({
            eventName: 'send_success',
            from: current.context.from,
            asset: current.context.asset,
            amount: current.context.amount,
            fee_asset: current.feeAsset,
            app_id: current.context.appId
        });
    }, [finish, track]);

    const fail = useCallback(
        (error: unknown) => {
            const current = attempt.current;
            if (!current) return;
            attempt.current = null;
            if (toRedOutcome(error) === 'cancel') {
                finish('cancel', { stage: 'confirm' });
                return;
            }
            const redError = toRedError(error, 'transaction_send_failed');
            finish('fail', { error: redError, stage: 'send' });
            track({
                eventName: 'send_failed',
                from: current.context.from,
                asset: current.context.asset,
                amount: current.context.amount,
                fee_asset: current.feeAsset,
                // Most send errors carry no numeric code; 0 is what Android reports then.
                error_code: redError.code ?? 0,
                error_message: redError.message,
                app_id: current.context.appId
            });
        },
        [finish, track]
    );

    return useMemo(() => ({ confirm, succeed, fail }), [confirm, succeed, fail]);
};
