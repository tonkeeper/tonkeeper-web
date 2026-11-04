import { FC, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';

import { useAnalyticsTrack } from '../../../hooks/analytics';
import type { RampSource } from '../../../hooks/analytics/ramp-flow';
import { rampSourceToSendFrom, toMultichainSendContext } from '../../../hooks/analytics/send';
import { useNavigate } from '../../../hooks/router/useNavigate';
import { MultichainRoute } from '../../../libs/routes';

import { SendChooseAssetScreen } from './SendChooseAssetScreen';
import { SendFormScreen } from './SendFormScreen';
import { SendConfirmScreen } from './SendConfirmScreen';
import { MultichainSendState } from './multichainSendShared';

export type MultichainSendPrefill = Partial<
    Pick<MultichainSendState, 'toAddress' | 'amountDisplay' | 'comment'>
>;

export interface MultichainSendFlowProps {
    isOpen: boolean;
    onClose: () => void;
    /**
     * Runs once the transfer is broadcast and the done state has played out.
     * Defaults to opening History, where the pending transfer shows up.
     */
    onSent?: () => void;
    /** Opens the add-funds flow from the picker's empty state. */
    onAddFunds?: () => void;
    /**
     * Start the flow on the form with this asset pre-selected (e.g. launched
     * from a token page's Send action), skipping the asset picker. The form
     * becomes the first screen (no back); the token pill can still re-open the
     * picker.
     */
    initialAsset?: MultichainWalletAsset;
    /**
     * Seed the form's fields on open (e.g. a scanned QR or a `ton://`
     * transfer link). Stepping back from confirm still restores what the
     * user actually typed — the prefill only applies to a fresh session.
     *
     * Applies without `initialAsset` too: a link naming a token the wallet
     * doesn't hold carries a recipient but no asset, so the flow opens on
     * the picker and the prefill lands on the asset picked there.
     */
    initialForm?: MultichainSendPrefill;
    /**
     * Scope the asset picker to these network keys — the chains a
     * link's recipient address is valid on. Undefined leaves it
     * unscoped.
     */
    allowedNetworks?: string[];
    /** Where the send was started, for the funnels the flow can lead into. */
    from?: RampSource;
}

type Step = 'choose_asset' | 'form' | 'confirm';

/**
 * Multichain send flow orchestrator: Choose asset → Send form → Confirm
 * (which owns its own Done state). Mirrors the onramp step-machine in
 * `HomeMultichainActions`: each step is its own `Modal`, gated on `step`,
 * and the parent owns the picked asset + assembled form state.
 */
export const MultichainSendFlow: FC<MultichainSendFlowProps> = ({
    isOpen,
    onClose,
    onSent,
    onAddFunds,
    initialAsset,
    initialForm,
    allowedNetworks,
    from = 'wallet_screen'
}) => {
    const navigate = useNavigate();
    const afterSent = onSent ?? (() => navigate(MultichainRoute.history));

    const firstStep: Step = initialAsset ? 'form' : 'choose_asset';
    const [step, setStep] = useState<Step>(firstStep);
    const [asset, setAsset] = useState<MultichainWalletAsset | undefined>(initialAsset);
    const [sendState, setSendState] = useState<MultichainSendState | undefined>();
    // The asset `initialForm` belongs to. Known upfront when the caller
    // pre-selects one; otherwise claimed by the first asset picked in the
    // session. Changing token afterwards doesn't re-claim it, so a prefill
    // the user has already edited away never comes back.
    const [prefillAssetId, setPrefillAssetId] = useState(initialAsset?.assetId);
    // Bumped on every open so the form remounts and re-reads `initialForm`
    // even when the same asset is pre-selected twice in a row.
    const [session, setSession] = useState(0);

    // Snap back to the entry step whenever the flow opens, so a new session
    // never inherits the previous one's step/asset/confirm state. Resetting on
    // open (before paint) — rather than on a delayed timer after close — keeps
    // the last screen visible through the close animation and avoids the race
    // where reopening quickly cancels a pending reset.
    const wasOpen = useRef(isOpen);
    useLayoutEffect(() => {
        const justOpened = isOpen && !wasOpen.current;
        wasOpen.current = isOpen;
        if (!justOpened) return;
        setStep(firstStep);
        setAsset(initialAsset);
        setSendState(undefined);
        setPrefillAssetId(initialAsset?.assetId);
        setSession(n => n + 1);
    }, [isOpen, firstStep, initialAsset]);

    const track = useAnalyticsTrack();
    const sendFrom = rampSourceToSendFrom(from);
    // Callers may mount the flow already open, so the open is read off
    // `isOpen` itself rather than its transition.
    const openTracked = useRef(false);
    useEffect(() => {
        if (!isOpen) {
            openTracked.current = false;
            return;
        }
        if (openTracked.current) return;
        openTracked.current = true;
        track({ eventName: 'send_open', from: sendFrom });
    }, [isOpen, sendFrom, track]);

    return (
        <>
            <SendChooseAssetScreen
                isOpen={isOpen && step === 'choose_asset'}
                onClose={onClose}
                onBack={asset ? () => setStep('form') : undefined}
                onSelect={picked => {
                    setAsset(picked);
                    setPrefillAssetId(claimed => claimed ?? picked.assetId);
                    setStep('form');
                }}
                selectedAssetId={asset?.assetId}
                onAddFunds={onAddFunds}
                allowedNetworks={allowedNetworks}
            />
            {asset && (
                <SendFormScreen
                    key={`${session}:${asset.assetId}`}
                    isOpen={isOpen && step === 'form'}
                    onClose={onClose}
                    onBack={initialAsset ? undefined : () => setStep('choose_asset')}
                    asset={asset}
                    onChangeToken={() => setStep('choose_asset')}
                    onContinue={state => {
                        const context = toMultichainSendContext({
                            from,
                            assetId: state.asset.assetId,
                            amount: state.amount,
                            decimals: state.asset.decimals
                        });
                        track({
                            eventName: 'send_click',
                            from: context.from,
                            asset: context.asset,
                            amount: context.amount
                        });
                        setSendState({ ...state, from });
                        setStep('confirm');
                    }}
                    initial={
                        sendState && sendState.asset.assetId === asset.assetId
                            ? {
                                  toAddress: sendState.toDomain ?? sendState.toAddress,
                                  amountDisplay: sendState.amountDisplay,
                                  comment: sendState.comment
                              }
                            : asset.assetId === prefillAssetId
                            ? initialForm
                            : undefined
                    }
                />
            )}
            {sendState && (
                <SendConfirmScreen
                    isOpen={isOpen && step === 'confirm'}
                    onClose={onClose}
                    onSent={afterSent}
                    onBack={() => setStep('form')}
                    state={sendState}
                />
            )}
        </>
    );
};
