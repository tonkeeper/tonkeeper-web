import { atom, useAtom } from 'jotai';
import { TON_ASSET, TON_USDT_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import BigNumber from 'bignumber.js';

export const swapFromAsset$ = atom<TonAsset>(TON_ASSET);
export const swapToAsset$ = atom<TonAsset>(TON_USDT_ASSET);
export const swapAmount$ = atom<BigNumber | undefined>(new BigNumber(1));

const swapOptions$ = atom({
    spippagePercent: 1
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
