import { Button } from '../fields/Button';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import {
    useIsSwapFormNotCompleted,
    useMaxSwapValue,
    useSelectedSwap,
    useSwapFromAmount,
    useSwapFromAsset,
    useSwapPriceImpact
} from '../../state/swap/useSwapForm';
import { useCalculatedSwap } from '../../state/swap/useCalculatedSwap';
import { FC } from 'react';
import { useIsActiveWalletLedger } from '../../state/ledger';
import { useSwapOptions } from '../../state/swap/useSwapOptions';

export const SwapButton: FC<{ onClick: () => void; isEncodingProcess: boolean }> = ({
    onClick,
    isEncodingProcess
}) => {
    const [swapAmount] = useSwapFromAmount();
    const [fromAsset] = useSwapFromAsset();
    const { data: max } = useMaxSwapValue();
    const { isFetching, data: calculatedSwaps } = useCalculatedSwap();
    const [selectedSwap] = useSelectedSwap();

    const priceImpact = useSwapPriceImpact();
    const { data: swapOptions } = useSwapOptions();

    const isNotCompleted = useIsSwapFormNotCompleted();
    const activeIsLedger = useIsActiveWalletLedger();

    if (activeIsLedger) {
        return (
            <Button size="large" secondary disabled>
                Swaps with Ledger are not supported
            </Button>
        );
    }

    if (isNotCompleted) {
        return (
            <Button size="large" secondary disabled>
                Enter an amount
            </Button>
        );
    }

    if (!isFetching && calculatedSwaps?.every(s => !s.trade)) {
        return (
            <Button size="large" disabled>
                Trading is not available
            </Button>
        );
    }

    if ((isFetching && !selectedSwap?.trade) || !max || priceImpact === undefined || !swapOptions) {
        return (
            <Button size="large" secondary loading={true}>
                Continue
            </Button>
        );
    }

    if (!selectedSwap || !selectedSwap.trade) {
        return (
            <Button size="large" secondary disabled>
                Trading is not available
            </Button>
        );
    }

    const isNotEnoughFunds = swapAmount?.gt(shiftedDecimals(max!, fromAsset.decimals));

    if (isNotEnoughFunds) {
        return (
            <Button size="large" secondary disabled>
                Not enough funds
            </Button>
        );
    }

    const priceImpactTooHigh = priceImpact?.gt(swapOptions.maxPriceImpact);
    if (priceImpactTooHigh) {
        return (
            <Button size="large" secondary disabled>
                Price impact too high
            </Button>
        );
    }

    return (
        <Button size="large" primary onClick={onClick} loading={isEncodingProcess}>
            Continue
        </Button>
    );
};
