import { Button } from '../fields/Button';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import {
    useIsSwapFormNotCompleted,
    useMaxSwapValue,
    useSelectedSwap,
    useSwapFromAmount,
    useSwapFromAsset,
    useSwapOptions,
    useSwapPriceImpact
} from '../../state/swap/useSwapForm';
import { useCalculatedSwap } from '../../state/swap/useCalculatedSwap';
import { FC } from 'react';

export const SwapButton: FC<{ onClick: () => void; isEncodingProcess: boolean }> = ({
    onClick,
    isEncodingProcess
}) => {
    const [swapAmount] = useSwapFromAmount();
    const [fromAsset] = useSwapFromAsset();
    const { data: max } = useMaxSwapValue();
    const { isFetching } = useCalculatedSwap();
    const [selectedSwap] = useSelectedSwap();

    const priceImpact = useSwapPriceImpact();
    const [{ maxPriceImpact }] = useSwapOptions();

    const isNotCompleted = useIsSwapFormNotCompleted();

    if (isNotCompleted) {
        return <Button disabled>Enter an amount</Button>;
    }

    if (isFetching || !max || priceImpact === undefined) {
        return <Button loading={true}>Continue</Button>;
    }

    if (!selectedSwap || !selectedSwap.trade) {
        return <Button disabled>Trading is not available</Button>;
    }

    const isNotEnoughFunds = swapAmount?.gt(shiftedDecimals(max, fromAsset.decimals));

    if (isNotEnoughFunds) {
        return <Button disabled>Not enough funds</Button>;
    }

    const priceImpactTooHigh = priceImpact?.gt(maxPriceImpact);
    if (priceImpactTooHigh) {
        return <Button disabled>Price impact too high</Button>;
    }

    return (
        <Button primary onClick={onClick} loading={isEncodingProcess}>
            Continue
        </Button>
    );
};
