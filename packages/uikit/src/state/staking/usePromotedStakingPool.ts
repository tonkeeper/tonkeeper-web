import { useMemo } from 'react';
import { PoolImplementationType, PoolInfo } from '@tonkeeper/core/dist/tonApiV2';
import { useStakingPools } from './useStakingPools';

const isPromotedPool = (pool: PoolInfo) =>
    pool.implementation === PoolImplementationType.LiquidTf &&
    pool.name.toLowerCase().includes('tonstakers');

export const usePromotedStakingPool = (): PoolInfo | undefined => {
    const { data: pools } = useStakingPools();
    return useMemo(() => pools?.find(isPromotedPool), [pools]);
};
