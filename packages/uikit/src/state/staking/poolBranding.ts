import { PoolImplementationType, PoolInfo } from '@tonkeeper/core/dist/tonApiV2';

export type StakingPoolProvider = 'tonstakers' | 'tonnominators' | 'tonwhales' | 'tonkeeper';

const PROVIDER_LINK_URLS: Record<StakingPoolProvider, string | null> = {
    tonstakers: 'https://tonstakers.com',
    tonnominators: null,
    tonwhales: 'https://tonwhales.com',
    tonkeeper: null
};

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

export const getStakingPoolProviderLinkUrl = (pool: PoolInfo | undefined): string | null => {
    const provider = getStakingPoolProvider(pool);
    if (!provider) return null;
    return PROVIDER_LINK_URLS[provider];
};
