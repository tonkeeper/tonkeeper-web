import BigNumber from 'bignumber.js';
import { FC, useMemo } from 'react';
import {
    UNSTAKE_LIQUID_GAS_TON,
    UNSTAKE_WHALES_GAS_TON,
    UNSTAKE_TF_GAS_TON
} from '@tonkeeper/core/dist/service/ton-blockchain/encoder/staking-encoder';
import { PoolImplementationType, PoolInfo } from '@tonkeeper/core/dist/tonApiV2';
import { useTranslation } from '../../hooks/translation';
import { useTonBalance } from '../../state/wallet';
import { usePoolStakedBalance } from '../../state/staking/usePoolStakedBalance';
import { Button } from '../fields/Button';

export interface UnstakeButtonProps {
    onClick: () => void;
    isLoading: boolean;
    amount: string;
    pool: PoolInfo | undefined;
    encodeError: boolean;
}

export const UnstakeButton: FC<UnstakeButtonProps> = ({
    onClick,
    isLoading,
    amount,
    pool,
    encodeError
}) => {
    const { t } = useTranslation();
    const { data: tonBalance } = useTonBalance();
    const { tonAmount, isLoading: isBalanceLoading } = usePoolStakedBalance(pool);

    const amountBN = useMemo(() => {
        if (!amount) return undefined;
        const bn = new BigNumber(amount);
        return bn.isNaN() ? undefined : bn;
    }, [amount]);

    const isInsufficient = useMemo(() => {
        if (!amountBN || isBalanceLoading) return false;
        if (!tonAmount) return true;
        return amountBN.gt(tonAmount);
    }, [amountBN, tonAmount, isBalanceLoading]);

    const unstakeFee = useMemo(() => {
        if (pool?.implementation === PoolImplementationType.Whales) return UNSTAKE_WHALES_GAS_TON;
        if (pool?.implementation === PoolImplementationType.Tf) return UNSTAKE_TF_GAS_TON;
        return UNSTAKE_LIQUID_GAS_TON;
    }, [pool?.implementation]);

    const tonBalanceBN = tonBalance?.relativeAmount;
    const hasFeeTON = tonBalanceBN !== undefined && tonBalanceBN.gte(unstakeFee);

    if (!amountBN || amountBN.isZero() || amountBN.isNegative()) {
        return (
            <Button size="large" fullWidth secondary disabled>
                {t('staking_enter_amount')}
            </Button>
        );
    }

    if (isInsufficient) {
        return (
            <Button size="large" fullWidth secondary disabled>
                {t('staking_insufficient_balance')}
            </Button>
        );
    }

    if (isBalanceLoading || tonBalanceBN === undefined || tonAmount === undefined) {
        return <Button size="large" fullWidth secondary disabled loading />;
    }

    if (!hasFeeTON) {
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
