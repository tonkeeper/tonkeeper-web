import { useMutation } from '@tanstack/react-query';
import { CalculatedSwap } from './useCalculatedSwap';
import type { SwapService } from '@tonkeeper/core/dist/swapsApi';
import { assertUnreachable, NonNullableFields } from '@tonkeeper/core/dist/utils/types';
import { Address } from '@ton/core';
import { useAppContext, useWalletContext } from '../../hooks/appContext';
import { useSwapsConfig } from './useSwapsConfig';
import { useSwapOptions } from './useSwapForm';
import BigNumber from 'bignumber.js';

export function useExecuteSwap() {
    const { active } = useWalletContext();
    const { swapService } = useSwapsConfig();
    const { config } = useAppContext();
    const [{ slippagePercent }] = useSwapOptions();
    const referral = config.web_swaps_referral_address;

    return useMutation<
        { value: string; to: string; body: string },
        Error,
        NonNullableFields<CalculatedSwap>
    >(swap => {
        return swapService.encodeSwap({
            swap: swapToProviderSwap(swap),
            options: {
                senderAddress: active.rawAddress,
                slippage: new BigNumber(slippagePercent).div(100).decimalPlaces(5).toString(),
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
