import { TonConnectTransactionPayload } from '@tonkeeper/core/dist/entries/tonConnect';
import { toNano } from '@ton/core';
import BigNumber from 'bignumber.js';
import { FC, useState } from 'react';
import { styled } from 'styled-components';
import { AppRoute } from '../../libs/routes';
import { useAtom } from '../../libs/useAtom';
import { useEncodeStakingDeposit } from '../../state/staking/useEncodeStaking';
import { stakingSelectedPool$, useStakingPools } from '../../state/staking/useStakingPools';
import { TonTransactionNotification } from '../connect/TonTransactionNotification';
import { useNavigate } from '../../hooks/router/useNavigate';
import { StakingAmountInput } from './StakingAmountInput';
import { StakingButton } from './StakingButton';
import { StakingEarningsInfo } from './StakingEarningsInfo';
import { StakingPoolSelector } from './StakingPoolSelector';

const MainFormWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
`;

const TopRow = styled.div`
    display: flex;
    gap: 8px;
    align-items: flex-start;
`;

export const StakingForm: FC<{ className?: string }> = ({ className }) => {
    const [amount, setAmount] = useState('');
    const [modalParams, setModalParams] = useState<TonConnectTransactionPayload | null>(null);
    const [selectedPool] = useAtom(stakingSelectedPool$);
    const { data: pools, isError: poolsError } = useStakingPools();
    const { isLoading, isError: encodeError, mutateAsync: encode } = useEncodeStakingDeposit();
    const navigate = useNavigate();

    const pool = selectedPool ?? pools?.[0];

    const onConfirm = async () => {
        if (!pool || !amount) return;
        const amountBN = new BigNumber(amount);
        if (amountBN.isNaN() || amountBN.isZero() || amountBN.isNegative()) return;
        const amountNano = toNano(amountBN.toFixed(9));
        try {
            const params = await encode({ pool, amount: amountNano });
            setModalParams(params);
        } catch {
            // encode mutation tracks error state via React Query
        }
    };

    const onCloseConfirmModal = (result?: { boc: string }) => {
        setModalParams(null);
        if (result) {
            navigate(AppRoute.activity);
        }
    };

    return (
        <MainFormWrapper className={className}>
            <TopRow>
                <StakingAmountInput amount={amount} onChange={setAmount} />
                <StakingPoolSelector pool={pool} />
            </TopRow>
            <StakingEarningsInfo pool={pool} amount={amount} />
            <StakingButton
                onClick={onConfirm}
                isLoading={isLoading || !!modalParams}
                amount={amount}
                pool={pool}
                poolError={poolsError}
                encodeError={encodeError}
            />
            <TonTransactionNotification
                handleClose={onCloseConfirmModal}
                params={modalParams}
                waitInvalidation
            />
        </MainFormWrapper>
    );
};
