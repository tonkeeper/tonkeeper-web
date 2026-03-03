import { useMemo } from 'react';
import { eqAddresses } from '@tonkeeper/core/dist/utils/address';
import { usePortfolioBalances } from '../portfolio/usePortfolioBalances';

export type StakingEntryPoint =
    | { view: 'stake-form'; poolAddress: string }
    | { view: 'pool-detail'; poolAddress: string }
    | { view: 'pools-list' };

export const useStakingEntryPoint = (): StakingEntryPoint | undefined => {
    const { data: portfolio, isStakingReady } = usePortfolioBalances();

    return useMemo(() => {
        if (!portfolio || !isStakingReady) return undefined;

        if (!portfolio.tonstakersPool) return { view: 'pools-list' };

        const tonstakersPool = portfolio.tonstakersPool;

        const hasTonstakersLiquid = portfolio.tokenBalances.some(
            token =>
                token.stakingPool &&
                eqAddresses(token.stakingPool.address, tonstakersPool.address) &&
                token.assetAmount.weiAmount.gt(0)
        );

        const hasNonTonstakersPositions = portfolio.stakingPositions.some(
            position => !eqAddresses(position.pool.address, tonstakersPool.address)
        );

        if (!hasTonstakersLiquid && portfolio.stakingPositions.length === 0) {
            return { view: 'stake-form', poolAddress: tonstakersPool.address };
        }

        if (
            !hasNonTonstakersPositions &&
            (hasTonstakersLiquid || portfolio.stakingPositions.length > 0)
        ) {
            return { view: 'pool-detail', poolAddress: tonstakersPool.address };
        }

        return { view: 'pools-list' };
    }, [portfolio, isStakingReady]);
};
