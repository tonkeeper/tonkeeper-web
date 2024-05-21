import { useMutation } from '@tanstack/react-query';
import { CalculatedSwap } from './useCalculatedSwap';
import { SwapService } from '@tonkeeper/core/dist/swapsApi';
import { assertUnreachable, NonNullableFields } from '@tonkeeper/core/dist/utils/types';
import { Address } from '@ton/core';
import { useWalletContext } from '../../hooks/appContext';

export function useExecuteSwap() {
    const { active } = useWalletContext();
    return useMutation<
        { value: string; to: string; body: string },
        Error,
        NonNullableFields<CalculatedSwap>
    >(async swap => {
        const encoded = await SwapService.encodeSwap({
            swap: swapToProviderSwap(swap),
            options: {
                senderAddress: active.rawAddress,
                slippage: '0.01', // TODO
                referralAddress: Address.parse(
                    'UQD2NmD_lH5f5u1Kj3KfGyTvhZSX0Eg6qp2a5IQUKXxOGzCi'
                ).toRawString() // TODO
            }
        });

        return encoded;
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
