import { FC, useLayoutEffect, useRef, useState } from 'react';
import BigNumber from 'bignumber.js';
import { toNano } from '@ton/core';

import { TonConnectTransactionPayload } from '@tonkeeper/core/dist/entries/tonConnect';
import { PoolImplementationType, PoolInfo } from '@tonkeeper/core/dist/tonApiV2';

import { useTranslation } from '../../../../hooks/translation';
import { useToast } from '../../../../hooks/useNotification';
import { usePoolStakedBalance } from '../../../../state/staking/usePoolStakedBalance';
import { useStakingCycleCountdown } from '../../../../state/staking/useStakingCycleCountdown';
import { useEncodeStakingUnstake } from '../../../../state/staking/useEncodeStaking';
import { convertTonToPoolTokenNano } from '../../../../state/staking/poolStakeState';
import {
    useStakingAnalyticsProps,
    useTrackStakingConfirm,
    useTrackStakingFormOpen
} from '../../../../hooks/analytics/staking';
import { StakingAmountScreen } from './StakingAmountScreen';
import { StakingConfirmScreen } from './StakingConfirmScreen';

export interface MultichainUnstakeFlowProps {
    isOpen: boolean;
    onClose: () => void;
    pool: PoolInfo;
}

type Step = 'amount' | 'confirm';

/**
 * Unstake flow: Amount (available = the staked TON value, with the
 * validation-cycle hint) → Confirm. Encoding follows the legacy unstake
 * semantics: liquid pools burn the pool token (converted from the entered
 * TON amount, or send-all on MAX), Whales withdraw the TON amount
 * (send-all on MAX), TF pools support full withdrawal only.
 */
export const MultichainUnstakeFlow: FC<MultichainUnstakeFlowProps> = ({
    isOpen,
    onClose,
    pool
}) => {
    const { t } = useTranslation();
    const toast = useToast();

    const isTfPool = pool.implementation === PoolImplementationType.Tf;
    const isWhalesPool = pool.implementation === PoolImplementationType.Whales;

    const {
        tonAmount: staked,
        isLiquid,
        liquidTokenBalance,
        tonPrice
    } = usePoolStakedBalance(pool);
    const countdown = useStakingCycleCountdown(pool);
    const encodeUnstake = useEncodeStakingUnstake();

    const analyticsProps = useStakingAnalyticsProps(pool);
    useTrackStakingFormOpen({
        isOpen,
        operation: 'unstake',
        from: 'staking_viewer',
        props: analyticsProps
    });
    const trackConfirm = useTrackStakingConfirm('unstake', analyticsProps);

    const [step, setStep] = useState<Step>('amount');
    const [amount, setAmount] = useState<BigNumber>(new BigNumber(0));
    const [payload, setPayload] = useState<TonConnectTransactionPayload | undefined>();
    const [sessionId, setSessionId] = useState(0);

    const wasOpen = useRef(isOpen);
    useLayoutEffect(() => {
        const justOpened = isOpen && !wasOpen.current;
        wasOpen.current = isOpen;
        if (!justOpened) return;
        setStep('amount');
        setAmount(new BigNumber(0));
        setPayload(undefined);
        setSessionId(id => id + 1);
    }, [isOpen]);

    const onContinue = async (tonAmount: BigNumber, isMax: boolean) => {
        if (!staked) return;
        trackConfirm();

        // Entering the full staked value (or more, within the validation
        // rounding) is a send-all even without the MAX button — a rate
        // conversion of the "exact" amount would leave dust behind.
        const isSendAllAmount = isMax || tonAmount.gte(staked);

        setAmount(tonAmount);
        try {
            let encoderAmount: bigint;
            let isSendAll = false;
            if (isLiquid) {
                if (isSendAllAmount || !liquidTokenBalance || !tonPrice) {
                    encoderAmount = 0n;
                    isSendAll = true;
                } else {
                    encoderAmount = convertTonToPoolTokenNano(
                        tonAmount,
                        liquidTokenBalance,
                        tonPrice
                    );
                }
            } else {
                encoderAmount = toNano(tonAmount.toFixed(9));
                isSendAll = isWhalesPool && isSendAllAmount;
            }

            const params = await encodeUnstake.mutateAsync({
                pool,
                amount: encoderAmount,
                isSendAll
            });
            setPayload(params);
            setStep('confirm');
        } catch (e) {
            // The encode mutation tracks its own error state; a conversion
            // throw (missing rate) would otherwise die silently.
            if (!encodeUnstake.isError) {
                toast(t('error_occurred'));
                console.error(e);
            }
        }
    };

    return (
        <>
            <StakingAmountScreen
                // TF withdraws the full stake: re-seed the fixed amount once
                // the staked balance resolves (the screen owns its input state).
                key={`${sessionId}:${isTfPool ? staked?.toFixed() ?? 'tf-loading' : 'editable'}`}
                isOpen={isOpen && step === 'amount'}
                onClose={onClose}
                title={t('staking_action_unstake')}
                available={staked}
                maxAmount={staked}
                getAmountError={tonAmount =>
                    !staked || staked.lt(tonAmount) ? t('staking_insufficient_balance') : undefined
                }
                initialAmount={
                    isTfPool
                        ? staked?.decimalPlaces(9, BigNumber.ROUND_DOWN).toFixed()
                        : amount.gt(0)
                        ? amount.toFixed()
                        : undefined
                }
                readOnly={isTfPool}
                continueLoading={encodeUnstake.isLoading}
                onContinue={(tonAmount, isMax) => onContinue(tonAmount, isMax || isTfPool)}
            >
                {isTfPool ? (
                    <div className="rounded-medium bg-backgroundContent px-4 py-3 text-body2 text-textSecondary">
                        {t('staking_tf_full_withdrawal_only')}
                    </div>
                ) : (
                    isLiquid &&
                    countdown && (
                        <div className="rounded-medium bg-backgroundContent px-4 py-3 text-body2 text-textSecondary">
                            {t('staking_unstake_cycle_hint', { value: countdown })}
                        </div>
                    )
                )}
            </StakingAmountScreen>

            {payload && (
                <StakingConfirmScreen
                    isOpen={isOpen && step === 'confirm'}
                    onClose={onClose}
                    onBack={() => setStep('amount')}
                    pool={pool}
                    amount={amount}
                    variant="unstake"
                    payload={payload}
                />
            )}
        </>
    );
};
