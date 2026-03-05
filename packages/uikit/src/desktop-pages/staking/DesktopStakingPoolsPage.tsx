import BigNumber from 'bignumber.js';
import { FC, MouseEvent, useMemo } from 'react';
import { styled } from 'styled-components';
import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import { AccountStakingInfo, PoolInfo } from '@tonkeeper/core/dist/tonApiV2';
import { eqAddresses } from '@tonkeeper/core/dist/utils/address';
import { useTranslation } from '../../hooks/translation';
import { useNavigate } from '../../hooks/router/useNavigate';
import { AppRoute, StakingRoute } from '../../libs/routes';
import { formatter, formatTokenDisplay } from '../../hooks/balance';
import { useFormatFiat, useRate } from '../../state/rates';
import { Body3, Label2 } from '../../components/Text';
import {
    DesktopViewHeader,
    DesktopViewHeaderContent
} from '../../components/desktop/DesktopViewLayout';
import {
    PortfolioTokenBalance,
    usePortfolioBalances
} from '../../state/portfolio/usePortfolioBalances';
import {
    getStakingPoolTonAmount,
    hasActiveStakeForPool,
    StakingPoolLiquidTokenBalance
} from '../../state/staking/poolStakeState';
import { StakingPoolIcon } from '../../components/staking/StakingPoolIcon';
import { StakingPageWrapper } from './StakingLayout';

const PoolList = styled.div`
    display: flex;
    flex-direction: column;
`;

const PoolRow = styled.div`
    display: flex;
    align-items: center;
    cursor: pointer;
    position: relative;

    &:hover {
        background: ${p => p.theme.backgroundContentTint};
    }

    &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 0.5px;
        background: ${p => p.theme.separatorCommon};
    }
`;

const PoolIconWrapper = styled.div`
    display: flex;
    align-items: center;
    padding: 8px 0 8px 16px;
    flex-shrink: 0;
`;

const PoolCenter = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: center;
    min-height: 36px;
    min-width: 1px;
    padding: 10px 16px 10px 12px;
    gap: 0;
`;

const PoolInfoRow = styled.div`
    display: flex;
    gap: 8px;
    align-items: flex-start;
    width: 100%;
`;

const PoolInfoLeft = styled.div`
    flex: 1;
    min-width: 1px;
    min-height: 1px;
`;

const PoolInfoRight = styled.div`
    flex-shrink: 0;
`;

const PoolNameLabel = styled(Label2)`
    color: ${p => p.theme.textPrimary};
    font-weight: 510;
    white-space: nowrap;
`;

const PoolAmountLabel = styled(Label2)`
    color: ${p => p.theme.textPrimary};
    font-weight: 510;
    white-space: nowrap;
    text-align: right;
`;

const PoolSecondaryText = styled(Body3)`
    color: ${p => p.theme.textSecondary};
    white-space: nowrap;
`;

const PoolSecondaryTextRight = styled(Body3)`
    color: ${p => p.theme.textSecondary};
    white-space: nowrap;
    text-align: right;
`;

const PoolPendingText = styled(Body3)`
    color: ${p => p.theme.textSecondary};
`;

const StakeButton = styled.button`
    display: flex;
    align-items: center;
    padding: 0 12px;
    min-height: 36px;
    background: ${p => p.theme.buttonSecondaryBackground};
    color: ${p => p.theme.buttonSecondaryForeground};
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 510;
    line-height: 20px;
    letter-spacing: -0.15px;
    white-space: nowrap;
    flex-shrink: 0;

    &:hover {
        opacity: 0.88;
    }
`;

interface PoolListRowProps {
    pool: PoolInfo;
    position: AccountStakingInfo | undefined;
    stakingTokenBalance?: PortfolioTokenBalance;
    onClick: () => void;
    onStake: () => void;
}

const PoolListRow: FC<PoolListRowProps> = ({
    pool,
    position,
    stakingTokenBalance,
    onClick,
    onStake
}) => {
    const { t } = useTranslation();
    const { data: tonRate } = useRate(CryptoCurrency.TON);
    const tonPrice = useMemo(() => {
        return tonRate?.prices !== undefined ? new BigNumber(tonRate.prices) : undefined;
    }, [tonRate?.prices]);

    const liquidTokenBalance = useMemo<StakingPoolLiquidTokenBalance | undefined>(() => {
        if (!stakingTokenBalance) {
            return undefined;
        }

        return {
            weiAmount: stakingTokenBalance.assetAmount.weiAmount,
            relativeAmount: stakingTokenBalance.assetAmount.relativeAmount,
            price: stakingTokenBalance.price
        };
    }, [stakingTokenBalance]);

    const hasActivePosition = useMemo(() => {
        return hasActiveStakeForPool({ position, liquidTokenBalance });
    }, [position, liquidTokenBalance]);

    const tonAmount = useMemo(() => {
        return getStakingPoolTonAmount({ position, liquidTokenBalance, tonPrice });
    }, [position, liquidTokenBalance, tonPrice]);

    const { fiatAmount } = useFormatFiat(tonRate, tonAmount);

    const hasPendingWithdraw = (position?.pendingWithdraw ?? 0) > 0;
    const pendingAmount = useMemo(() => {
        return formatter.formatDisplay(shiftedDecimals(position?.pendingWithdraw ?? 0));
    }, [position?.pendingWithdraw]);

    const displayAmount = useMemo(() => {
        return formatTokenDisplay(tonAmount, 'TON');
    }, [tonAmount]);

    const minStakeTON = shiftedDecimals(new BigNumber(pool.minStake)).toFixed(0);

    const handleStakeClick = (e: MouseEvent) => {
        e.stopPropagation();
        onStake();
    };

    return (
        <PoolRow onClick={onClick}>
            <PoolIconWrapper>
                <StakingPoolIcon pool={pool} size={40} variant="provider" />
            </PoolIconWrapper>
            <PoolCenter>
                <PoolInfoRow>
                    <PoolInfoLeft>
                        <PoolNameLabel>{pool.name}</PoolNameLabel>
                    </PoolInfoLeft>
                    {hasActivePosition ? (
                        <PoolInfoRight>
                            <PoolAmountLabel>{displayAmount}</PoolAmountLabel>
                        </PoolInfoRight>
                    ) : (
                        <PoolInfoRight>
                            <StakeButton onClick={handleStakeClick}>
                                {t('staking_top_up')}
                            </StakeButton>
                        </PoolInfoRight>
                    )}
                </PoolInfoRow>
                <PoolInfoRow>
                    <PoolInfoLeft>
                        <PoolSecondaryText>
                            {t('staking_pools_apy', { apy: pool.apy.toFixed(2) })}
                            {!hasActivePosition &&
                                ` · ${t('staking_pools_min_deposit', { minDeposit: minStakeTON })}`}
                        </PoolSecondaryText>
                    </PoolInfoLeft>
                    {hasActivePosition && fiatAmount && (
                        <PoolInfoRight>
                            <PoolSecondaryTextRight>{fiatAmount}</PoolSecondaryTextRight>
                        </PoolInfoRight>
                    )}
                </PoolInfoRow>
                {hasPendingWithdraw && (
                    <PoolInfoRow>
                        <PoolInfoLeft>
                            <PoolPendingText>
                                {t('staking_pools_pending_withdraw', { amount: pendingAmount })}
                            </PoolPendingText>
                        </PoolInfoLeft>
                    </PoolInfoRow>
                )}
            </PoolCenter>
        </PoolRow>
    );
};

export const DesktopStakingPoolsPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const { data: portfolio, isStakingLoading } = usePortfolioBalances();
    const tonstakersPool = portfolio?.tonstakersPool;

    const poolRows = useMemo(() => {
        const rows: Array<{
            pool: PoolInfo;
            position: AccountStakingInfo | undefined;
            stakingTokenBalance?: PortfolioTokenBalance;
        }> = [];

        if (!portfolio) {
            return rows;
        }

        const upsertRow = (
            pool: PoolInfo,
            patch: Partial<{
                position: AccountStakingInfo | undefined;
                stakingTokenBalance?: PortfolioTokenBalance;
            }>
        ) => {
            const existingIndex = rows.findIndex(row =>
                eqAddresses(row.pool.address, pool.address)
            );
            if (existingIndex === -1) {
                rows.push({
                    pool,
                    position: patch.position,
                    stakingTokenBalance: patch.stakingTokenBalance
                });
                return;
            }

            rows[existingIndex] = { ...rows[existingIndex], ...patch };
        };

        for (const { pool, position } of portfolio.stakingPositions) {
            upsertRow(pool, { position });
        }

        for (const token of portfolio.tokenBalances) {
            if (!token.stakingPool) continue;
            upsertRow(token.stakingPool, { stakingTokenBalance: token });
        }

        if (tonstakersPool) {
            upsertRow(tonstakersPool, {});
            const tonstakersIndex = rows.findIndex(row =>
                eqAddresses(row.pool.address, tonstakersPool.address)
            );
            if (tonstakersIndex > 0) {
                const [tonstakersRow] = rows.splice(tonstakersIndex, 1);
                rows.unshift(tonstakersRow);
            }
        }

        return rows;
    }, [portfolio, tonstakersPool]);

    const handlePoolClick = (poolAddress: string) => {
        navigate(AppRoute.staking + StakingRoute.pool + '/' + poolAddress);
    };

    const handleStakeClick = (poolAddress: string) => {
        navigate(AppRoute.staking + StakingRoute.stake + '/' + poolAddress);
    };

    const isLoading = isStakingLoading && !tonstakersPool;

    return (
        <StakingPageWrapper mobileContentPaddingTop>
            <DesktopViewHeader borderBottom>
                <DesktopViewHeaderContent title={t('staking_title')} />
            </DesktopViewHeader>
            {isLoading ? (
                <div />
            ) : (
                <PoolList>
                    {poolRows.map(({ pool, position, stakingTokenBalance }) => (
                        <PoolListRow
                            key={pool.address}
                            pool={pool}
                            position={position}
                            stakingTokenBalance={stakingTokenBalance}
                            onClick={() => handlePoolClick(pool.address)}
                            onStake={() => handleStakeClick(pool.address)}
                        />
                    ))}
                </PoolList>
            )}
        </StakingPageWrapper>
    );
};
