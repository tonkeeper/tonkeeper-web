import { useMutation } from '@tanstack/react-query';
import { CalculatedSwap } from './useCalculatedSwap';
import type { SwapService } from '@tonkeeper/core/dist/swapsApi';
import { assertUnreachable, NonNullableFields } from '@tonkeeper/core/dist/utils/types';
import { Address } from '@ton/core';
import { useAppContext, useWalletContext } from '../../hooks/appContext';
import { useSwapsConfig } from './useSwapsConfig';
import BigNumber from 'bignumber.js';
import { useSwapOptions } from './useSwapOptions';

export function useExecuteSwap() {
    const { active } = useWalletContext();
    const { swapService } = useSwapsConfig();
    const { config } = useAppContext();
    const { data: swapOpaitons } = useSwapOptions();
    const referral = config.web_swaps_referral_address;

    return useMutation<
        { value: string; to: string; body: string },
        Error,
        NonNullableFields<CalculatedSwap>
    >(swap => {
        if (!swapOpaitons) {
            throw new Error('SwapOptions query was not resolved yet');
        }
        return swapService.encodeSwap({
            swap: swapToProviderSwap(swap),
            options: {
                senderAddress: active.rawAddress,
                slippage: new BigNumber(swapOpaitons.slippagePercent)
                    .div(100)
                    .decimalPlaces(5)
                    .toString(),
                ...(referral && { referralAddress: Address.parse(referral).toRawString() })
            }
        });
    });
}

const swapToProviderSwap = (
    swap: NonNullableFields<CalculatedSwap>
): Parameters<typeof SwapService.encodeSwap>[0]['swap'] => {
    if (swap.provider === 'stonfi') {
        return {
            provider: 'stonfi',
            stonfiTrade: swap.trade.rawTrade
        };
    }
    if (swap.provider === 'dedust') {
        return {
            provider: 'dedust',
            dedustTrade: swap.trade.rawTrade
        };
    }

    assertUnreachable(swap);
};
