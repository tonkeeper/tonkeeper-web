import BigNumber from 'bignumber.js';
import { toNano } from '@ton/core';
import { TonConnectTransactionPayload } from '@tonkeeper/core/dist/entries/tonConnect';
import { PoolImplementationType } from '@tonkeeper/core/dist/tonApiV2';
import { FC, useEffect, useMemo, useState } from 'react';
import { styled } from 'styled-components';
import { AppRoute } from '../../libs/routes';
import { useAtom } from '../../libs/useAtom';
import { useTranslation } from '../../hooks/translation';
import { useNavigate } from '../../hooks/router/useNavigate';
import { stakingSelectedPool$ } from '../../state/staking/stakingAtoms';
import { useStakingPools } from '../../state/staking/useStakingPools';
import { useEncodeStakingUnstake } from '../../state/staking/useEncodeStaking';
import { useStakingCycleCountdown } from '../../state/staking/useStakingCycleCountdown';
import { usePoolStakedBalance } from '../../state/staking/usePoolStakedBalance';
import { convertTonToPoolTokenNano } from '../../state/staking/poolStakeState';
import { Body3 } from '../Text';
import { StakingTransactionModal } from './StakingTransactionModal';
import { UnstakeAmountInput } from './UnstakeAmountInput';
import { UnstakeButton } from './UnstakeButton';

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

const CycleInfoCard = styled.div`
    background: ${p => p.theme.backgroundContent};
    border-radius: ${p =>
        p.theme.displayType === 'full-width' ? p.theme.corner2xSmall : p.theme.cornerSmall};
    padding: 12px;
    flex: 1;
    min-width: 0;
    min-height: 52px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
`;

const CycleInfoText = styled(Body3)`
    color: ${p => p.theme.textSecondary};
`;

export const UnstakeForm: FC<{ className?: string }> = ({ className }) => {
    const { t } = useTranslation();
    const [amount, setAmount] = useState('');
    const [isMax, setIsMax] = useState(false);
    const [modalParams, setModalParams] = useState<TonConnectTransactionPayload | null>(null);
    const [selectedPool] = useAtom(stakingSelectedPool$);
    const { data: pools } = useStakingPools();
    const { isLoading, isError: encodeError, mutateAsync: encode } = useEncodeStakingUnstake();
    const navigate = useNavigate();

    const pool = selectedPool ?? pools?.[0];
    const isTfPool = pool?.implementation === PoolImplementationType.Tf;
    const isWhalesPool = pool?.implementation === PoolImplementationType.Whales;

    const { tonAmount, isLiquid, liquidTokenBalance, tonPrice } = usePoolStakedBalance(pool);
    const countdown = useStakingCycleCountdown(pool);

    useEffect(() => {
        if (isTfPool && tonAmount !== undefined) {
            setIsMax(true);
            setAmount(tonAmount.toFixed(9, BigNumber.ROUND_DOWN));
        }
    }, [isTfPool, tonAmount]);

    const amountBN = useMemo(() => {
        if (!amount) return undefined;
        const bn = new BigNumber(amount);
        return bn.isNaN() ? undefined : bn;
    }, [amount]);

    const onAmountChange = (value: string) => {
        setIsMax(false);
        setAmount(value);
    };

    const onMaxClick = () => {
        if (tonAmount !== undefined) {
            setIsMax(true);
            setAmount(tonAmount.toFixed(9, BigNumber.ROUND_DOWN));
        }
    };

    const onConfirm = async () => {
        if (!pool || !tonAmount || !amountBN || amountBN.isZero() || amountBN.isNegative()) return;

        let encoderAmount: bigint;
        let isSendAll = false;

        if (isLiquid) {
            if (isMax) {
                encoderAmount = 0n;
                isSendAll = true;
            } else {
                encoderAmount = convertTonToPoolTokenNano(amountBN, liquidTokenBalance!, tonPrice!);
            }
        } else {
            encoderAmount = toNano(amountBN.toFixed(9));
            isSendAll = isWhalesPool && isMax;
        }

        try {
            const params = await encode({ pool, amount: encoderAmount, isSendAll });
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
                <UnstakeAmountInput
                    amount={amount}
                    onChange={onAmountChange}
                    onMaxClick={onMaxClick}
                    pool={pool}
                />
                {isLiquid && countdown && (
                    <CycleInfoCard>
                        <CycleInfoText>
                            {t('staking_unstake_cycle_info', { value: countdown })}
                        </CycleInfoText>
                    </CycleInfoCard>
                )}
            </TopRow>
            <UnstakeButton
                onClick={onConfirm}
                isLoading={isLoading || !!modalParams}
                amount={amount}
                pool={pool}
                encodeError={encodeError}
            />
            <StakingTransactionModal
                handleClose={onCloseConfirmModal}
                params={modalParams}
                pool={pool}
                amount={amount}
                variant="unstake"
                waitInvalidation
            />
        </MainFormWrapper>
    );
};
