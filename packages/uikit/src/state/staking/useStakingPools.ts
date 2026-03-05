import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { PoolInfo, StakingApi } from '@tonkeeper/core/dist/tonApiV2';
import { atom } from '@tonkeeper/core/dist/entries/atom';
import { eqAddresses } from '@tonkeeper/core/dist/utils/address';
import { QueryKey } from '../../libs/queryKey';
import { useActiveApi, useActiveWallet, useActiveTonNetwork } from '../wallet';
import { FLAGGED_FEATURE, useIsFeatureEnabled } from '../tonendpoint';

export const stakingSelectedPool$ = atom<PoolInfo | undefined>(undefined);

export const useStakingPools = () => {
    const wallet = useActiveWallet();
    const api = useActiveApi();
    const network = useActiveTonNetwork();
    const isEnabled = useIsFeatureEnabled(FLAGGED_FEATURE.STAKING);

    return useQuery<PoolInfo[], Error>(
        [wallet.rawAddress, QueryKey.staking, 'pools', network],
        async () => {
            const response = await new StakingApi(api.tonApiV2).getStakingPools({
                availableFor: wallet.rawAddress,
                includeUnverified: false
            });

            return response.pools;
        },
        {
            staleTime: 60_000,
            enabled: isEnabled
        }
    );
};

export const useIsStakingJetton = (
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
