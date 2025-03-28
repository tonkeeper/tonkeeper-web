import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import { FC } from 'react';
import { useTranslation } from '../../hooks/translation';
import { useCalculatedSwap } from '../../state/swap/useCalculatedSwap';
import {
    useIsSwapFormNotCompleted,
    useMaxSwapValue,
    useSelectedSwap,
    useSwapFromAmount,
    useSwapFromAsset,
    useSwapPriceImpact
} from '../../state/swap/useSwapForm';
import { useSwapOptions } from '../../state/swap/useSwapOptions';
import { Button } from '../fields/Button';

export const SwapButton: FC<{
    onClick: () => void;
    isEncodingProcess: boolean;
    size?: 'medium' | 'large' | 'small';
}> = ({ onClick, isEncodingProcess, size = 'medium' }) => {
    const { t } = useTranslation();
    const [swapAmount] = useSwapFromAmount();
    const [fromAsset] = useSwapFromAsset();
    const { data: max } = useMaxSwapValue();
    const { isFetching, data: calculatedSwaps } = useCalculatedSwap();
    const [selectedSwap] = useSelectedSwap();

    const priceImpact = useSwapPriceImpact();
    const { data: swapOptions } = useSwapOptions();

    const isNotCompleted = useIsSwapFormNotCompleted();

    if (isNotCompleted) {
        return (
            <Button size={size} secondary disabled>
                {t('swap_enter_amount')}
            </Button>
        );
    }

    if (!isFetching && calculatedSwaps?.every(s => !s.trade)) {
        return (
            <Button size={size} disabled>
                {t('swap_trade_is_not_available')}
            </Button>
        );
    }

    if ((isFetching && !selectedSwap?.trade) || !max || priceImpact === undefined || !swapOptions) {
        return (
            <Button size={size} secondary loading={true}>
                {t('continue')}
            </Button>
        );
    }

    if (!selectedSwap || !selectedSwap.trade) {
        return (
            <Button size={size} secondary disabled>
                {t('swap_trade_is_not_available')}
            </Button>
        );
    }

    const isNotEnoughFunds = swapAmount?.gt(shiftedDecimals(max!, fromAsset.decimals));

    if (isNotEnoughFunds) {
        return (
            <Button size={size} secondary disabled>
                {t('swap_not_enough_funds')}
            </Button>
        );
    }

    const priceImpactTooHigh = priceImpact?.gt(swapOptions.maxPriceImpact);
    if (priceImpactTooHigh) {
        return (
            <Button size={size} secondary disabled>
                {t('swap_price_impact_too_high')}
            </Button>
        );
    }

    return (
        <Button size={size} primary onClick={onClick} loading={isEncodingProcess}>
            {t('continue')}
        </Button>
    );
};
