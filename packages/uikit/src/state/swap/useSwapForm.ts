import { TON_ASSET, TON_USDT_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import BigNumber from 'bignumber.js';
import { useAtom } from '../../libs/useAtom';
import { useAssetWeiBalance } from '../home';
import { useCallback, useMemo } from 'react';
import { eqAddresses } from '@tonkeeper/core/dist/utils/address';
import { atom } from '@tonkeeper/core/dist/entries/atom';
import { swapConfirmation$ } from './useSwapStreamEffect';

export const swapFromAsset$ = atom<TonAsset>(TON_ASSET);
export const swapToAsset$ = atom<TonAsset>(TON_USDT_ASSET);
export const swapAmount$ = atom<BigNumber | undefined>(new BigNumber(1));

export const useSwapFromAsset = () => {
    const [fromAsset, _setFromAsset] = useAtom(swapFromAsset$);
    const [_, _setToAsset] = useAtom(swapToAsset$);

    const setFromAsset = useCallback(
        (asset: TonAsset) => {
            if (eqAddresses(asset.address, swapToAsset$.value.address)) {
                _setToAsset(swapFromAsset$.value);
            }

            _setFromAsset(asset);
        },
        [_setFromAsset, _setToAsset]
    );

    return [fromAsset, setFromAsset] as const;
};

export const useSwapToAsset = () => {
    const [toAsset, _setToAsset] = useAtom(swapToAsset$);
    const [_, _setFromAsset] = useAtom(swapFromAsset$);

    const setToAsset = useCallback(
        (asset: TonAsset) => {
            if (eqAddresses(asset.address, swapFromAsset$.value.address)) {
                _setFromAsset(swapToAsset$.value);
            }

            _setToAsset(asset);
        },
        [_setToAsset, _setFromAsset]
    );

    return [toAsset, setToAsset] as const;
};

export const useSwapFromAmount = () => {
    return useAtom(swapAmount$);
};

// TODO: This is a rough estimate. Should be dynamically calculated from gasBudget returned by the SSE stream.
const TON_RESERVE_NANOTONS = '500000000'; // 0.5 TON

export const useMaxSwapValue = () => {
    const [fromAsset] = useSwapFromAsset();
    const balance = useAssetWeiBalance(fromAsset);

    return useMemo(() => {
        if (balance === undefined) {
            return { data: undefined, isLoading: true };
        }

        if (fromAsset.id === TON_ASSET.id) {
            const balanceWithoutReserve = balance.minus(new BigNumber(TON_RESERVE_NANOTONS));
            return {
                data: balanceWithoutReserve.lt(0) ? new BigNumber(0) : balanceWithoutReserve,
                isLoading: false
            };
        }

        return { data: balance, isLoading: false };
    }, [fromAsset.id, balance]);
};

/** Signed basis points (-300 = the user receives 3% less USD than they pay); absent when |bps| < 300 or prices are unknown. */
export const useSwapValueDifferenceBps = () => {
    const [confirmation] = useAtom(swapConfirmation$);
    return confirmation?.valueDifferenceBps;
};

export { useMaxPriceImpact } from './useSwapOptions';

export type ValueDifferenceStatus = 'normal' | 'warning' | 'danger';

export const valueDifferenceStatus = (bps: number | undefined): ValueDifferenceStatus => {
    if (bps === undefined || bps >= -300) return 'normal';
    if (bps < -500) return 'danger';
    return 'warning';
};

export const useIsSwapFormNotCompleted = () => {
    const [fromAmount] = useSwapFromAmount();
    return !fromAmount || fromAmount.isZero();
};
