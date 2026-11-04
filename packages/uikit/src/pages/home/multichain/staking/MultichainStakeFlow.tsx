import { FC, useLayoutEffect, useMemo, useRef, useState } from 'react';
import BigNumber from 'bignumber.js';
import { toNano } from '@ton/core';

import { TonConnectTransactionPayload } from '@tonkeeper/core/dist/entries/tonConnect';
import { PoolInfo } from '@tonkeeper/core/dist/tonApiV2';
import { BRAND_CONFIG } from '@tonkeeper/core/dist/config/brand';
import {
    stakeBalanceReserveTon,
    stakeTemporaryReserveTon
} from '@tonkeeper/core/dist/service/ton-blockchain/encoder/staking-encoder';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import { formatAmount, formatDecimal } from '@tonkeeper/core/dist/utils/numberFormat';

import { useTranslation } from '../../../../hooks/translation';
import { useAppSdk } from '../../../../hooks/appSdk';
import { useActiveConfig, useTonBalance } from '../../../../state/wallet';
import { useStakingPools } from '../../../../state/staking/useStakingPools';
import { usePromotedStakingPool } from '../../../../state/staking/usePromotedStakingPool';
import { usePoolStakedBalance } from '../../../../state/staking/usePoolStakedBalance';
import { useEncodeStakingDeposit } from '../../../../state/staking/useEncodeStaking';
import {
    StakingSource,
    useStakingAnalyticsProps,
    useTrackStakingConfirm,
    useTrackStakingFormOpen
} from '../../../../hooks/analytics/staking';
import IcInformationCircle16 from '../../../../icons/components/IcInformationCircle16';
import IcSwitch16 from '../../../../icons/components/IcSwitch16';
import { StakingAmountScreen } from './StakingAmountScreen';
import { StakingConfirmScreen } from './StakingConfirmScreen';
import {
    StakeOptionsScreen,
    StakePoolDetailScreen,
    StakePoolListScreen,
    StakingPoolGroup,
    maxApyPoolOf,
    poolsOfGroup
} from './StakePoolScreens';
import { AccentTag, StakingPoolLogo, formatCoinAmount } from './staking-shared';
import { MultichainHeaderIconButton } from '../MultichainHeaderIconButton';

export interface MultichainStakeFlowProps {
    isOpen: boolean;
    onClose: () => void;
    /**
     * Stake into this pool only (launched from a position page). The pool
     * switcher is replaced by the "Your APY" projection rows.
     */
    fixedPool?: PoolInfo;
    from: StakingSource;
}

type Step = 'amount' | 'options' | 'pool_list' | 'pool_detail' | 'confirm';

const yearlyEarnings = (staked: BigNumber, apy: number): BigNumber =>
    staked.multipliedBy(apy).div(100);

/** Selected-pool cell on the amount screen; taps open the pool picker. */
const SelectedPoolCell: FC<{
    pool: PoolInfo;
    showMaxApyTag: boolean;
    tonAmount: BigNumber;
    onClick: () => void;
}> = ({ pool, showMaxApyTag, tonAmount, onClick }) => {
    const { t } = useTranslation();
    const earnings = yearlyEarnings(tonAmount, pool.apy);
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full cursor-pointer items-center rounded-medium bg-backgroundContent text-left transition-colors duration-100 hover:bg-backgroundContentTint"
        >
            <span className="py-4 pl-4">
                <StakingPoolLogo pool={pool} className="size-11" />
            </span>
            <span className="min-w-0 flex-1 p-4">
                <span className="flex items-center gap-1.5">
                    <span className="truncate text-label1 text-textPrimary">{pool.name}</span>
                    {showMaxApyTag && <AccentTag>{t('staking_max_apy_tag')}</AccentTag>}
                </span>
                <span className="block truncate text-body2 text-textSecondary">
                    {t('staking_pools_apy', { apy: formatDecimal(pool.apy) })}
                    {earnings.gt(0) && (
                        <>
                            <span className="text-textTertiary">{' · '}</span>≈{' '}
                            {formatAmount(earnings)} {BRAND_CONFIG.coinSymbol}
                        </>
                    )}
                </span>
            </span>
            <span className="py-4 pl-4 pr-[22px] text-iconTertiary">
                <IcSwitch16 className="size-4" />
            </span>
        </button>
    );
};

/** "Your APY" projection rows for the fixed-pool (top-up) variant. */
const YourApySection: FC<{ pool: PoolInfo; tonAmount: BigNumber }> = ({ pool, tonAmount }) => {
    const { t } = useTranslation();
    const { tonAmount: staked } = usePoolStakedBalance(pool);
    const current = yearlyEarnings(staked ?? new BigNumber(0), pool.apy);
    const afterStake = yearlyEarnings((staked ?? new BigNumber(0)).plus(tonAmount), pool.apy);
    return (
        <section>
            <h3 className="pb-3.5 text-h3 text-textPrimary">{t('staking_your_apy_title')}</h3>
            <div className="rounded-medium bg-backgroundContent py-2">
                {tonAmount.gt(0) && (
                    <div className="flex items-start gap-2 px-4 py-2">
                        <span className="text-body2 text-textSecondary">
                            {t('staking_rewards_after_stake')}
                        </span>
                        <span className="flex-1 text-right text-body2 text-textPrimary">
                            {t('staking_rewards_value', {
                                value: formatAmount(afterStake)
                            })}
                        </span>
                    </div>
                )}
                <div className="flex items-start gap-2 px-4 py-2">
                    <span className="text-body2 text-textSecondary">
                        {t('staking_rewards_current')}
                    </span>
                    <span className="flex-1 text-right text-body2 text-textPrimary">
                        {t('staking_rewards_value', {
                            value: formatAmount(current)
                        })}
                    </span>
                </div>
            </div>
        </section>
    );
};

/**
 * Stake flow orchestrator: Amount → (Options → provider pool list → pool
 * detail) → Confirm. Mirrors the send flow's step machine — each step is
 * its own `Modal`, gated on `step`; the parent owns the picked pool and
 * the entered amount.
 */
export const MultichainStakeFlow: FC<MultichainStakeFlowProps> = ({
    isOpen,
    onClose,
    fixedPool,
    from
}) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const { stakingInfoUrl } = useActiveConfig();

    const { data: pools } = useStakingPools();
    const promotedPool = usePromotedStakingPool();
    const { data: tonBalance } = useTonBalance();
    const encodeDeposit = useEncodeStakingDeposit();

    const [step, setStep] = useState<Step>('amount');
    const [pickedPool, setPickedPool] = useState<PoolInfo | undefined>();
    const [group, setGroup] = useState<StakingPoolGroup>('whales');
    const [detailPool, setDetailPool] = useState<PoolInfo | undefined>();
    const [amount, setAmount] = useState<BigNumber>(new BigNumber(0));
    const [payload, setPayload] = useState<TonConnectTransactionPayload | undefined>();
    const [sessionId, setSessionId] = useState(0);

    const selectedPool = fixedPool ?? pickedPool ?? promotedPool ?? pools?.[0];
    const maxApyPool = useMemo(() => maxApyPoolOf(pools ?? []), [pools]);

    const analyticsProps = useStakingAnalyticsProps(selectedPool);
    useTrackStakingFormOpen({ isOpen, operation: 'stake', from, props: analyticsProps });
    const trackConfirm = useTrackStakingConfirm('stake', analyticsProps);

    // Snap back to the amount step whenever the flow opens, so a new session
    // never inherits the previous one's pool/amount/confirm state.
    const wasOpen = useRef(isOpen);
    useLayoutEffect(() => {
        const justOpened = isOpen && !wasOpen.current;
        wasOpen.current = isOpen;
        if (!justOpened) return;
        setStep('amount');
        setPickedPool(undefined);
        setDetailPool(undefined);
        setAmount(new BigNumber(0));
        setPayload(undefined);
        setSessionId(id => id + 1);
    }, [isOpen]);

    const balance = tonBalance?.relativeAmount;
    const balanceReserve = selectedPool
        ? stakeBalanceReserveTon(selectedPool.implementation)
        : undefined;
    const maxAmount = useMemo(() => {
        if (!balance || balanceReserve === undefined) return undefined;
        const max = balance.minus(balanceReserve);
        return max.gt(0) ? max : new BigNumber(0);
    }, [balance, balanceReserve]);
    const minStakeTon = selectedPool ? shiftedDecimals(selectedPool.minStake) : undefined;
    const isInsufficient = (tonAmount: BigNumber) =>
        !balance || balanceReserve === undefined || balance.lt(tonAmount.plus(balanceReserve));

    const holdsReserve =
        !!selectedPool && stakeTemporaryReserveTon(selectedPool.implementation) > 0;
    const balanceReserveText = balanceReserve !== undefined ? formatCoinAmount(balanceReserve) : '';

    const onContinueAmount = async (tonAmount: BigNumber, _isMax: boolean) => {
        if (!selectedPool) return;
        trackConfirm();
        setAmount(tonAmount);
        try {
            const params = await encodeDeposit.mutateAsync({
                pool: selectedPool,
                amount: toNano(tonAmount.toFixed(9))
            });
            setPayload(params);
            setStep('confirm');
        } catch {
            // encode mutation tracks error state via React Query
        }
    };

    const infoButton = stakingInfoUrl ? (
        <MultichainHeaderIconButton
            label={t('staking_title')}
            icon={<IcInformationCircle16 className="size-4" />}
            onClick={() => sdk.openPage(stakingInfoUrl)}
            className="rounded-full text-textPrimary"
        />
    ) : undefined;

    return (
        <>
            <StakingAmountScreen
                key={sessionId}
                isOpen={isOpen && step === 'amount'}
                onClose={onClose}
                topBarLeft={infoButton}
                title={t('staking_action_stake')}
                available={balance}
                maxAmount={maxAmount}
                getAmountError={tonAmount => {
                    if (isInsufficient(tonAmount)) {
                        return t('staking_insufficient_balance');
                    }
                    if (minStakeTon && tonAmount.lt(minStakeTon)) {
                        return t('staking_minimum_deposit_line', {
                            minDeposit: formatAmount(minStakeTon)
                        });
                    }
                    return undefined;
                }}
                getAmountErrorHint={tonAmount =>
                    holdsReserve && isInsufficient(tonAmount)
                        ? t('staking_leave_reserve_hint', { value: balanceReserveText })
                        : undefined
                }
                maxHint={
                    holdsReserve
                        ? t('staking_max_reserve_hint', { value: balanceReserveText })
                        : undefined
                }
                initialAmount={amount.gt(0) ? amount.toFixed() : undefined}
                continueLoading={encodeDeposit.isLoading}
                onContinue={onContinueAmount}
            >
                {tonAmount =>
                    selectedPool &&
                    (fixedPool ? (
                        <YourApySection pool={fixedPool} tonAmount={tonAmount} />
                    ) : (
                        <SelectedPoolCell
                            pool={selectedPool}
                            showMaxApyTag={maxApyPool?.address === selectedPool.address}
                            tonAmount={tonAmount}
                            onClick={() => setStep('options')}
                        />
                    ))
                }
            </StakingAmountScreen>

            <StakeOptionsScreen
                isOpen={isOpen && step === 'options'}
                onClose={onClose}
                onBack={() => setStep('amount')}
                pools={pools ?? []}
                selectedPool={selectedPool}
                onOpenPool={pool => {
                    setDetailPool(pool);
                    setStep('pool_detail');
                }}
                onOpenGroup={pickedGroup => {
                    setGroup(pickedGroup);
                    setStep('pool_list');
                }}
            />

            <StakePoolListScreen
                isOpen={isOpen && step === 'pool_list'}
                onClose={onClose}
                onBack={() => setStep('options')}
                group={group}
                pools={poolsOfGroup(pools ?? [], group)}
                selectedPool={selectedPool}
                onOpenPool={pool => {
                    setDetailPool(pool);
                    setStep('pool_detail');
                }}
            />

            {detailPool && (
                <StakePoolDetailScreen
                    isOpen={isOpen && step === 'pool_detail'}
                    onClose={onClose}
                    onBack={() =>
                        setStep(
                            poolsOfGroup(pools ?? [], group).some(
                                pool => pool.address === detailPool.address
                            )
                                ? 'pool_list'
                                : 'options'
                        )
                    }
                    pool={detailPool}
                    showMaxApyTag={maxApyPool?.address === detailPool.address}
                    onChoose={() => {
                        setPickedPool(detailPool);
                        setStep('amount');
                    }}
                />
            )}

            {selectedPool && payload && (
                <StakingConfirmScreen
                    isOpen={isOpen && step === 'confirm'}
                    onClose={onClose}
                    onBack={() => setStep('amount')}
                    pool={selectedPool}
                    amount={amount}
                    variant="stake"
                    payload={payload}
                />
            )}
        </>
    );
};
