import { useMemo } from 'react';
import { eqAddresses } from '@tonkeeper/core/dist/utils/address';
import { usePortfolioBalances } from '../portfolio/usePortfolioBalances';
import { usePromotedStakingPool } from './usePromotedStakingPool';

export type StakingEntryPoint =
    | { view: 'stake-form'; poolAddress: string }
    | { view: 'pool-detail'; poolAddress: string }
    | { view: 'pools-list' };

export const useStakingEntryPoint = (): StakingEntryPoint | undefined => {
    const { data: portfolio, isStakingReady } = usePortfolioBalances();
    const promotedPool = usePromotedStakingPool();

    return useMemo(() => {
        if (!portfolio || !isStakingReady) return undefined;

        if (!promotedPool) return { view: 'pools-list' };

        const hasPromotedLiquid = portfolio.tokenBalances.some(
            token =>
                token.stakingPool &&
                eqAddresses(token.stakingPool.address, promotedPool.address) &&
                token.assetAmount.weiAmount.gt(0)
        );

        const hasNonPromotedPositions = portfolio.stakingPositions.some(
            position => !eqAddresses(position.pool.address, promotedPool.address)
        );

        if (!hasPromotedLiquid && portfolio.stakingPositions.length === 0) {
            return { view: 'stake-form', poolAddress: promotedPool.address };
        }

        if (
            !hasNonPromotedPositions &&
            (hasPromotedLiquid || portfolio.stakingPositions.length > 0)
        ) {
            return { view: 'pool-detail', poolAddress: promotedPool.address };
        }

        return { view: 'pools-list' };
    }, [portfolio, isStakingReady, promotedPool]);
};
