import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import { FC } from 'react';
import { useTranslation } from '../../hooks/translation';
import { useSwapConfirmation } from '../../state/swap/useSwapStreamEffect';
import {
    useIsSwapFormNotCompleted,
    useMaxSwapValue,
    useSwapFromAmount,
    useSwapFromAsset,
    useSwapPriceImpact,
    MAX_PRICE_IMPACT
} from '../../state/swap/useSwapForm';
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
    const { confirmation, isFetching, error } = useSwapConfirmation();

    const priceImpact = useSwapPriceImpact();

    const isNotCompleted = useIsSwapFormNotCompleted();

    if (isNotCompleted) {
        return (
            <Button size={size} secondary disabled>
                {t('swap_enter_amount')}
            </Button>
        );
    }

    if (!isFetching && !confirmation && error) {
        return (
            <Button size={size} disabled>
                {t('swap_trade_is_not_available')}
            </Button>
        );
    }

    if ((isFetching && !confirmation) || !max || priceImpact === undefined) {
        return (
            <Button size={size} secondary loading={true}>
                {t('continue')}
            </Button>
        );
    }

    if (!confirmation) {
        return (
            <Button size={size} secondary disabled>
                {t('swap_trade_is_not_available')}
            </Button>
        );
    }

    const isExpired =
        confirmation.tradeStartDeadline &&
        Number(confirmation.tradeStartDeadline) < Date.now() / 1000;

    if (isExpired) {
        return (
            <Button size={size} secondary disabled>
                {t('swap_trade_is_not_available')}
            </Button>
        );
    }

    const isNotEnoughFunds = swapAmount?.gt(shiftedDecimals(max, fromAsset.decimals));

    if (isNotEnoughFunds) {
        return (
            <Button size={size} secondary disabled>
                {t('swap_not_enough_funds')}
            </Button>
        );
    }

    const priceImpactTooHigh = priceImpact?.gt(MAX_PRICE_IMPACT);
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
