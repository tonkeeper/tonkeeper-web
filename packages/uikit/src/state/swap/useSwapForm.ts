import { TON_ASSET, TON_USDT_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import {
    TonAsset,
    tonAssetAddressToString
} from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import BigNumber from 'bignumber.js';
import { atom, useAtom } from '../../libs/atom';
import { useQuery } from '@tanstack/react-query';
import { QueryKey } from '../../libs/queryKey';
import { SwapService } from '@tonkeeper/core/dist/swapsApi';
import { useAssetWeiBalance } from '../home';
import { CalculatedSwap } from './useCalculatedSwap';
import { useRate } from '../rates';

export const swapFromAsset$ = atom<TonAsset>(TON_ASSET);
export const swapToAsset$ = atom<TonAsset>(TON_USDT_ASSET);
export const swapAmount$ = atom<BigNumber | undefined>(new BigNumber(1));

const swapOptions$ = atom({
    slippagePercent: 1
});

export const useSwapFromAsset = () => {
    return useAtom(swapFromAsset$);
};

export const useSwapToAsset = () => {
    return useAtom(swapToAsset$);
};

export const useSwapFromAmount = () => {
    return useAtom(swapAmount$);
};

export const useSwapOptions = () => {
    return useAtom(swapOptions$);
};

export const useMaxSwapValue = () => {
    const { data: swapGas } = useSwapGasConfig();
    const [fromAsset] = useSwapFromAsset();
    const balance = useAssetWeiBalance(fromAsset);

    return useQuery({
        queryKey: [QueryKey.swapMaxValue, swapGas, fromAsset.id, balance?.toFixed(0)],
        queryFn: async () => {
            if (!balance || !swapGas) {
                return undefined;
            }

            if (fromAsset.id === TON_ASSET.id) {
                const dedustGas = new BigNumber(swapGas.dedust.tonToJetton);
                const stonfiGas = new BigNumber(swapGas.stonfi.tonToJetton);

                const balanceWithoutFee = balance.minus(BigNumber.max(dedustGas, stonfiGas));
                if (balanceWithoutFee.lt(0)) {
                    return new BigNumber(0);
                }

                return balanceWithoutFee;
            } else {
                return balance;
            }
        },
        enabled: !!swapGas && balance !== undefined
    });
};

export const useSwapGasConfig = () => {
    return useQuery({
        queryKey: [QueryKey.swapGasConfig],
        queryFn: async () => {
            return SwapService.swapGas();
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

    const { data: fromAssetRate } = useRate(tonAssetAddressToString(fromAsset.address));
    const { data: toAssetRate } = useRate(tonAssetAddressToString(toAsset.address));

    const trade = selectedSwap?.trade;
    if (!trade || !toAssetRate || !fromAssetRate) {
        return undefined;
    }

    if (!fromAssetRate.prices || !toAssetRate.prices) {
        return null;
    }

    const fromFiat = new BigNumber(trade.from.relativeAmount).multipliedBy(fromAssetRate.prices);
    const toFiat = new BigNumber(trade.to.relativeAmount).multipliedBy(toAssetRate.prices);

    if (fromFiat.isEqualTo(toFiat)) {
        return new BigNumber(0);
    }

    return fromFiat.minus(toFiat).dividedBy(fromFiat);
};
