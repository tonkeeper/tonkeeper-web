import { useMemo } from 'react';
import { PoolInfo } from '@tonkeeper/core/dist/tonApiV2';
import { useStakingPools } from './useStakingPools';
import { getStakingPoolProvider } from './poolBranding';

const isPromotedPool = (pool: PoolInfo) => getStakingPoolProvider(pool) === 'tonstakers';

export const usePromotedStakingPool = (): PoolInfo | undefined => {
    const { data: pools } = useStakingPools();
    return useMemo(() => pools?.find(isPromotedPool), [pools]);
};
