import { PoolImplementationType, PoolInfo } from '@tonkeeper/core/dist/tonApiV2';

export type StakingPoolProvider = 'tonstakers' | 'tonnominators' | 'tonwhales' | 'tonkeeper';

export const getStakingPoolProvider = (
    pool: PoolInfo | undefined
): StakingPoolProvider | undefined => {
    if (!pool) return undefined;

    if (pool.implementation === PoolImplementationType.LiquidTf) {
        return 'tonstakers';
    }

    if (pool.implementation === PoolImplementationType.Tf) {
        return 'tonnominators';
    }

    if (pool.implementation === PoolImplementationType.Whales) {
        const normalizedName = (pool.name ?? '').toLowerCase();
        if (normalizedName.includes('tonkeeper')) {
            return 'tonkeeper';
        }

        return 'tonwhales';
    }

    return undefined;
};
