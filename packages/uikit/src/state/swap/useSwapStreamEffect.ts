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
    const { baseUrl } = useSwapsConfig();
    const [fromAsset] = useSwapFromAsset();
    const [toAsset] = useSwapToAsset();
    const [fromAmountRelative] = useSwapFromAmount();
    const isNotCompleted = useIsSwapFormNotCompleted();
    const closeRef = useRef<(() => void) | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [, setConfirmation] = useAtom(swapConfirmation$);
    const [, setIsFetching] = useAtom(swapIsFetching$);
    const [, setError] = useAtom(swapError$);

    const subscribe = useCallback(() => {
        if (closeRef.current) {
            closeRef.current();
            closeRef.current = null;
        }

        if (isNotCompleted || !fromAmountRelative) {
            setConfirmation(null);
            setIsFetching(false);
            setError(null);
            return;
        }

        const fromAmountWei = unShiftedDecimals(fromAmountRelative, fromAsset.decimals);

        setIsFetching(true);
        setError(null);
        setConfirmation(null);

        const abortController = new AbortController();

        const { close } = subscribeToOmnistonStream({
            baseUrl,
            fromAsset: toTradeAssetId(fromAsset.address),
            toAsset: toTradeAssetId(toAsset.address),
            fromAmount: fromAmountWei.toFixed(0),
            userAddress: wallet.rawAddress,
            onQuote: confirmation => {
                setConfirmation(confirmation);
                setIsFetching(false);
            },
            onError: error => {
                setConfirmation(null);
                setError(error);
                setIsFetching(false);
            },
            signal: abortController.signal
        });

        closeRef.current = () => {
            abortController.abort();
            close();
        };
    }, [
        baseUrl,
        fromAsset,
        toAsset,
        fromAmountRelative,
        isNotCompleted,
        wallet.rawAddress,
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
}

export function useSwapConfirmation() {
    const [confirmation] = useAtom(swapConfirmation$);
    const [isFetching] = useAtom(swapIsFetching$);
    const [error] = useAtom(swapError$);

    return { confirmation, isFetching, error };
}
