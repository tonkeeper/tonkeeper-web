import { TON_ASSET, TON_USDT_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import {
    TonAsset,
    tonAssetAddressToString
} from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import BigNumber from 'bignumber.js';
import { atom, useAtom } from '../../libs/atom';
import { useQuery } from '@tanstack/react-query';
import { QueryKey } from '../../libs/queryKey';
import { useAssetWeiBalance } from '../home';
import { CalculatedSwap } from './useCalculatedSwap';
import { useRate } from '../rates';
import { useSwapsConfig } from './useSwapsConfig';
import { useCallback } from 'react';
import { eqAddresses } from '@tonkeeper/core/dist/utils/address';

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

export const useMaxSwapValue = () => {
    const TON_GAS_SAFETY_NANO_CONST = 1000000;
    const { data: swapGas, isError } = useSwapGasConfig();
    const [fromAsset] = useSwapFromAsset();
    const balance = useAssetWeiBalance(fromAsset);

    return useQuery({
        queryKey: [QueryKey.swapMaxValue, swapGas, fromAsset.id, balance?.toFixed(0)],
        queryFn: async () => {
            if (isError) {
                return balance;
            }
            if (!balance || !swapGas) {
                return undefined;
            }

            if (fromAsset.id === TON_ASSET.id) {
                const dedustGas = new BigNumber(swapGas.dedust.tonToJetton);
                const stonfiGas = new BigNumber(swapGas.stonfi.tonToJetton);

                const balanceWithoutFee = balance
                    .minus(BigNumber.max(dedustGas, stonfiGas))
                    .minus(TON_GAS_SAFETY_NANO_CONST);
                if (balanceWithoutFee.lt(0)) {
                    return new BigNumber(0);
                }

                return balanceWithoutFee;
            } else {
                return balance;
            }
        },
        enabled: (!!swapGas || isError) && balance !== undefined
    });
};

export const useSwapGasConfig = () => {
    const { swapService } = useSwapsConfig();

    return useQuery({
        queryKey: [QueryKey.swapGasConfig],
        queryFn: async () => {
            return swapService.swapGas();
        }
    });
};

export const selectedSwap$ = atom<CalculatedSwap | undefined>(undefined);

export const useSelectedSwap = () => {
    return useAtom(selectedSwap$);
};

export const useSwapPriceImpact = () => {
    const [fromAsset] = useSwapFromAsset();
    const [toAsset] = useSwapToAsset();
    const [selectedSwap] = useSelectedSwap();

    const { data: fromAssetRate, isLoading: fromAssetRateLoading } = useRate(
        tonAssetAddressToString(fromAsset.address)
    );
    const { data: toAssetRate, isLoading: toAssetRateLoading } = useRate(
        tonAssetAddressToString(toAsset.address)
    );

    const trade = selectedSwap?.trade;
    if (!trade || toAssetRateLoading || fromAssetRateLoading) {
        return undefined;
    }

    if (!fromAssetRate?.prices || !toAssetRate?.prices) {
        return null;
    }

    const fromFiat = new BigNumber(trade.from.relativeAmount).multipliedBy(fromAssetRate.prices);
    const toFiat = new BigNumber(trade.to.relativeAmount).multipliedBy(toAssetRate.prices);

    if (fromFiat.isEqualTo(toFiat)) {
        return new BigNumber(0);
    }

    return fromFiat.minus(toFiat).dividedBy(fromFiat);
};

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
