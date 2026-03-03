import BigNumber from 'bignumber.js';
import { FC, useMemo } from 'react';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import { PoolInfo } from '@tonkeeper/core/dist/tonApiV2';
import { useTranslation } from '../../hooks/translation';
import { useTonBalance } from '../../state/wallet';
import { Button } from '../fields/Button';
import { GAS_RESERVE_TON } from './StakingAmountInput';

export interface StakingButtonProps {
    onClick: () => void;
    isLoading: boolean;
    amount: string;
    pool: PoolInfo | undefined;
    poolError?: boolean;
    encodeError?: boolean;
}

export const StakingButton: FC<StakingButtonProps> = ({ onClick, isLoading, amount, pool, poolError, encodeError }) => {
    const { t } = useTranslation();
    const { data: balance } = useTonBalance();

    const amountBN = useMemo(() => {
        if (!amount) return undefined;
        const bn = new BigNumber(amount);
        return bn.isNaN() ? undefined : bn;
    }, [amount]);

    const balanceTON = useMemo(() => {
        if (!balance) return undefined;
        return balance.relativeAmount;
    }, [balance]);

    const minStakeTON = useMemo(() => {
        if (!pool) return undefined;
        return shiftedDecimals(new BigNumber(pool.minStake));
    }, [pool]);

    if (!amountBN || amountBN.isZero() || amountBN.isNegative()) {
        return (
            <Button size="large" fullWidth secondary disabled>
                {t('staking_enter_amount')}
            </Button>
        );
    }

    if (minStakeTON && amountBN.lt(minStakeTON)) {
        return (
            <Button size="large" fullWidth secondary disabled>
                {t('staking_min_deposit_label')}: {minStakeTON.toFixed(0)} TON
            </Button>
        );
    }

    if (!pool) {
        if (poolError) {
            return (
                <Button size="large" fullWidth secondary disabled>
                    {t('error_occurred')}
                </Button>
            );
        }
        return <Button size="large" fullWidth secondary disabled loading />;
    }

    if (!balanceTON) {
        return <Button size="large" fullWidth secondary disabled loading />;
    }

    if (amountBN.gt(balanceTON.minus(GAS_RESERVE_TON))) {
        return (
            <Button size="large" fullWidth secondary disabled>
                {t('staking_insufficient_balance')}
            </Button>
        );
    }

    if (encodeError) {
        return (
            <Button size="large" fullWidth secondary disabled>
                {t('error_occurred')}
            </Button>
        );
    }

    return (
        <Button size="large" fullWidth primary onClick={onClick} loading={isLoading}>
            {t('continue')}
        </Button>
    );
};
