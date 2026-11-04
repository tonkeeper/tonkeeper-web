import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
    GetStakingPools200Response,
    PoolImplementation,
    PoolImplementationType,
    PoolInfo,
    StakingApi
} from '@tonkeeper/core/dist/tonApiV2';
import { eqAddresses } from '@tonkeeper/core/dist/utils/address';
import { QueryKey } from '../../libs/queryKey';
import { useActiveApi, useActiveWallet, useActiveTonNetwork } from '../wallet';
import { FLAGGED_FEATURE, useIsFeatureEnabled } from '../tonendpoint';

const useStakingPoolsResponse = <T>(select: (response: GetStakingPools200Response) => T) => {
    const wallet = useActiveWallet();
    const api = useActiveApi();
    const network = useActiveTonNetwork();
    const isEnabled = useIsFeatureEnabled(FLAGGED_FEATURE.STAKING);

    return useQuery<GetStakingPools200Response, Error, T>(
        [wallet.rawAddress, QueryKey.staking, 'pools', network],
        async () => {
            return new StakingApi(api.tonApiV2).getStakingPools({
                availableFor: wallet.rawAddress,
                includeUnverified: false
            });
        },
        {
            staleTime: 60_000,
            enabled: isEnabled,
            select
        }
    );
};

const selectPools = (response: GetStakingPools200Response) => response.pools;

export const useStakingPools = () => {
    return useStakingPoolsResponse(selectPools);
};

const selectImplementations = (response: GetStakingPools200Response) =>
    response.implementations as Partial<Record<PoolImplementationType, PoolImplementation>>;

/**
 * Per-implementation metadata (site url + socials) shipped alongside the
 * pool list, keyed by `PoolImplementationType`.
 */
export const useStakingPoolImplementations = () => {
    return useStakingPoolsResponse(selectImplementations);
};

export const useStakingPoolByJetton = (
    jettonMasterAddress: string | undefined
): PoolInfo | undefined => {
    const { data: pools } = useStakingPools();

    return useMemo(() => {
        if (!pools || !jettonMasterAddress) return undefined;
        return pools.find(
            pool =>
                pool.liquidJettonMaster !== undefined &&
                eqAddresses(pool.liquidJettonMaster, jettonMasterAddress)
        );
    }, [pools, jettonMasterAddress]);
};
