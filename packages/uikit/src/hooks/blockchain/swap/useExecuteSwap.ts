import { useMutation } from '@tanstack/react-query';
import { CalculatedSwap } from './useCalculateSwap';
import { TradeService } from '@tonkeeper/core/dist/swapsApi';
import { assertUnreachable, NonNullableFields } from '@tonkeeper/core/dist/utils/types';
import { useWalletContext } from '../../appContext';

export function useExecuteSwap() {
    const { active } = useWalletContext();
    return useMutation<{ value: string; to: string; body: string }, Error, CalculatedSwap>(
        async swap => {
            const encoded = await TradeService.encodeTrade({
                swap: swapToProviderSwap(swap),
                execParams: {
                    senderAddress: active.rawAddress,
                    slippage: '0.01' // TODO
                    // referralAddress TODO
                }
            });

            return encoded;
        }
    );
}

const swapToProviderSwap = (
    swap: NonNullableFields<CalculatedSwap>
): Parameters<typeof TradeService.encodeTrade>[0]['swap'] => {
    if (swap.type === 'stonfi') {
        return {
            type: 'stonfi',
            trade: swap.trade.rawTrade
        };
    }
    if (swap.type === 'dedust') {
        return {
            type: 'dedust',
            trade: swap.trade.rawTrade
        };
    }

    assertUnreachable(swap.type as never);
};
