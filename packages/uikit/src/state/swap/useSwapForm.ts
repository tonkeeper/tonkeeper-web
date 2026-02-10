import { TON_ASSET, TON_USDT_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import {
    TonAsset,
    tonAssetAddressToString
} from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import BigNumber from 'bignumber.js';
import { useAtom } from '../../libs/useAtom';
import { useAssetWeiBalance } from '../home';
import { useRate } from '../rates';
import { useCallback, useMemo } from 'react';
import { eqAddresses } from '@tonkeeper/core/dist/utils/address';
import { atom } from '@tonkeeper/core/dist/entries/atom';
import { swapConfirmation$ } from './useSwapStreamEffect';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';

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

export const useSwapPriceImpact = () => {
    const [fromAsset] = useSwapFromAsset();
    const [toAsset] = useSwapToAsset();
    const [confirmation] = useAtom(swapConfirmation$);

    const { data: fromAssetRate, isLoading: fromAssetRateLoading } = useRate(
        tonAssetAddressToString(fromAsset.address)
    );
    const { data: toAssetRate, isLoading: toAssetRateLoading } = useRate(
        tonAssetAddressToString(toAsset.address)
    );

    if (!confirmation || toAssetRateLoading || fromAssetRateLoading) {
        return undefined;
    }

    if (!fromAssetRate?.prices || !toAssetRate?.prices) {
        return null;
    }

    const fromRelative = shiftedDecimals(new BigNumber(confirmation.bidUnits), fromAsset.decimals);
    const toRelative = shiftedDecimals(new BigNumber(confirmation.askUnits), toAsset.decimals);

    const fromFiat = fromRelative.multipliedBy(fromAssetRate.prices);
    const toFiat = toRelative.multipliedBy(toAssetRate.prices);

    if (fromFiat.isEqualTo(toFiat)) {
        return new BigNumber(0);
    }

    return fromFiat.minus(toFiat).dividedBy(fromFiat);
};

export const MAX_PRICE_IMPACT = 0.3;

export const priceImpactStatus = (priceImpact: BigNumber | null) => {
    if (!priceImpact) return 'unknown';
    if (priceImpact.isGreaterThan(0.05)) return 'high';
    if (priceImpact.isGreaterThan(0.01)) return 'medium';
    return 'low';
};

export const useIsSwapFormNotCompleted = () => {
    const [fromAmount] = useSwapFromAmount();
    return !fromAmount || fromAmount.isZero();
};
