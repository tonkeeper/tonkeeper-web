import { TonConnectTransactionPayload } from '@tonkeeper/core/dist/entries/tonConnect';
import { toNano } from '@ton/core';
import BigNumber from 'bignumber.js';
import { FC, useState } from 'react';
import { css, styled } from 'styled-components';
import { AppRoute } from '../../libs/routes';
import { useAtom } from '../../libs/useAtom';
import { useEncodeStakingDeposit } from '../../state/staking/useEncodeStaking';
import { stakingSelectedPool$ } from '../../state/staking/stakingAtoms';
import { useStakingPools } from '../../state/staking/useStakingPools';
import { StakingTransactionModal } from './StakingTransactionModal';
import { useNavigate } from '../../hooks/router/useNavigate';
import { StakingAmountInput } from './StakingAmountInput';
import { StakingButton } from './StakingButton';
import { StakingEarningsInfo } from './StakingEarningsInfo';
import { StakingPoolSelector } from './StakingPoolSelector';
import { Body3 } from '../Text';
import { useTranslation } from '../../hooks/translation';
import { PoolImplementationType } from '@tonkeeper/core/dist/tonApiV2';

const MainFormWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 24px;
`;

const TopRow = styled.div`
    display: flex;
    gap: 8px;
    align-items: flex-start;

    ${p =>
        (p.theme.proDisplayType === 'mobile' || p.theme.displayType === 'compact') &&
        css`
            flex-direction: column;
            align-items: stretch;
        `}
`;

const ButtonWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const Notice = styled(Body3)`
    color: ${p => p.theme.textTertiary};
    max-width: 520px;
`;

export const StakingForm: FC<{ className?: string }> = ({ className }) => {
    const [amount, setAmount] = useState('');
    const [modalParams, setModalParams] = useState<TonConnectTransactionPayload | null>(null);
    const [selectedPool] = useAtom(stakingSelectedPool$);
    const { data: pools, isError: poolsError } = useStakingPools();
    const { isLoading, isError: encodeError, mutateAsync: encode } = useEncodeStakingDeposit();
    const navigate = useNavigate();
    const { t } = useTranslation();

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
        if (result?.boc) {
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
            <ButtonWrapper>
                <StakingButton
                    onClick={onConfirm}
                    isLoading={isLoading || !!modalParams}
                    amount={amount}
                    pool={pool}
                    poolError={poolsError}
                    encodeError={encodeError}
                />
                {pool?.implementation === PoolImplementationType.LiquidTf && (
                    <Notice>{t('staking_tonstakers_notice')}</Notice>
                )}
            </ButtonWrapper>

            <StakingTransactionModal
                handleClose={onCloseConfirmModal}
                params={modalParams}
                pool={pool}
                amount={amount}
                waitInvalidation
            />
        </MainFormWrapper>
    );
};
