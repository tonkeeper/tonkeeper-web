import { useCallback, useEffect, useRef } from 'react';
import { isTon, TonAssetAddress } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { Address } from '@ton/core';
import { useSwapFromAmount, useSwapFromAsset, useSwapToAsset } from './useSwapForm';
import { useSwapsConfig } from './useSwapsConfig';
import { useActiveWallet } from '../wallet';
import { subscribeToOmnistonStream } from '@tonkeeper/core/dist/swapsApi';
import type { SwapConfirmation } from '@tonkeeper/core/dist/swapsApi';
import { atom } from '@tonkeeper/core/dist/entries/atom';
import { useAtom } from '../../libs/useAtom';
import { unShiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import { useIsSwapFormNotCompleted } from './useSwapForm';
import { useSlippageBps } from './useSwapOptions';
import { useAnalyticsTrack } from '../../hooks/analytics';
import { useAnalyticsAssetId } from '../../hooks/analytics/events-hooks';
import { toRedError } from '../../hooks/analytics/red-operation';
import { startSwapRedOperation } from '../../hooks/analytics/swap';

export const swapConfirmation$ = atom<SwapConfirmation | null>(null);
const swapIsFetching$ = atom(false);
const swapError$ = atom<Error | null>(null);

const toTradeAssetId = (address: TonAssetAddress) => {
    return isTon(address) ? 'ton' : Address.isAddress(address) ? address.toRawString() : address;
};

const DEBOUNCE_MS = 300;

/**
 * Side-effect-only hook that manages SSE subscription to the Omniston swap stream.
 * Must be mounted once at page level (desktop swap page / mobile swap notification).
 * Writes to global atoms (swapConfirmation$, swapIsFetching$, swapError$) that are
 * read by child components via useSwapConfirmation().
 */
export function useSwapStreamEffect() {
    const wallet = useActiveWallet();
    const { baseUrl, queryParams } = useSwapsConfig();
    const [fromAsset] = useSwapFromAsset();
    const [toAsset] = useSwapToAsset();
    const [fromAmountRelative] = useSwapFromAmount();
    const isNotCompleted = useIsSwapFormNotCompleted();
    const slippageBps = useSlippageBps();
    const closeRef = useRef<(() => void) | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastParamsRef = useRef<string | null>(null);
    const [, setConfirmation] = useAtom(swapConfirmation$);
    const [, setIsFetching] = useAtom(swapIsFetching$);
    const [, setError] = useAtom(swapError$);
    // Read through a ref: a tracker that resolves while the screen is up must
    // not restart the quote stream.
    const track = useAnalyticsTrack();
    const trackRef = useRef(track);
    trackRef.current = track;
    const analyticsAssetId = useAnalyticsAssetId();

    const subscribe = useCallback(() => {
        if (closeRef.current) {
            closeRef.current();
            closeRef.current = null;
        }

        if (isNotCompleted || !fromAmountRelative) {
            lastParamsRef.current = null;
            setConfirmation(null);
            setIsFetching(false);
            setError(null);
            return;
        }

        const fromAmountWei = unShiftedDecimals(fromAmountRelative, fromAsset.decimals);

        const paramsKey = `${toTradeAssetId(fromAsset.address)}:${toTradeAssetId(
            toAsset.address
        )}:${fromAmountWei.toFixed(0)}:${slippageBps}:${wallet.rawAddress}`;
        const isParamsChanged = lastParamsRef.current !== paramsKey;
        lastParamsRef.current = paramsKey;

        if (isParamsChanged) {
            setConfirmation(null);
        }
        setIsFetching(true);
        setError(null);

        const abortController = new AbortController();

        // One quote operation per subscription, settled by its first answer
        // like the native swap screens; the stream keeps re-quoting after that.
        const quoteSession = startSwapRedOperation(trackRef.current, 'quote', {
            from_asset: analyticsAssetId.fromAsset(fromAsset),
            to_asset: analyticsAssetId.fromAsset(toAsset),
            from_amount: fromAmountRelative.toNumber()
        });

        const { close } = subscribeToOmnistonStream({
            baseUrl,
            fromAsset: toTradeAssetId(fromAsset.address),
            toAsset: toTradeAssetId(toAsset.address),
            fromAmount: fromAmountWei.toFixed(0),
            userAddress: wallet.rawAddress,
            slippageBps,
            query: queryParams,
            onQuote: confirmation => {
                quoteSession.finish('success', { stage: 'quote' });
                setConfirmation(confirmation);
                setIsFetching(false);
            },
            onError: error => {
                quoteSession.finish('fail', {
                    stage: 'quote',
                    error: toRedError(error, 'native_swap')
                });
                setError(error);
                setIsFetching(false);
            },
            signal: abortController.signal
        });

        closeRef.current = () => {
            quoteSession.finish('cancel', { stage: 'quote' });
            abortController.abort();
            close();
        };
    }, [
        baseUrl,
        queryParams,
        fromAsset,
        toAsset,
        fromAmountRelative,
        isNotCompleted,
        slippageBps,
        wallet.rawAddress,
        analyticsAssetId,
        setConfirmation,
        setIsFetching,
        setError
    ]);

    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            subscribe();
        }, DEBOUNCE_MS);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
            if (closeRef.current) {
                closeRef.current();
                closeRef.current = null;
            }
        };
    }, [subscribe]);

    // Re-subscribe when app regains visibility or network
    useEffect(() => {
        const onResume = () => {
            if (!isNotCompleted && fromAmountRelative) {
                subscribe();
            }
        };

        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                onResume();
            }
        };

        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('online', onResume);

        return () => {
            document.removeEventListener('visibilitychange', onVisibilityChange);
            window.removeEventListener('online', onResume);
        };
    }, [subscribe, isNotCompleted, fromAmountRelative]);
}

export function useSwapConfirmation() {
    const [confirmation] = useAtom(swapConfirmation$);
    const [isFetching] = useAtom(swapIsFetching$);
    const [error] = useAtom(swapError$);

    return { confirmation, isFetching, error };
}
