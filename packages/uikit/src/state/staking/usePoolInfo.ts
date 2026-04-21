import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { AccountStakingInfo, PoolInfo, StakingApi } from '@tonkeeper/core/dist/tonApiV2';
import { eqAddresses } from '@tonkeeper/core/dist/utils/address';
import { QueryKey } from '../../libs/queryKey';
import { useActiveApi, useActiveWallet, useActiveTonNetwork } from '../wallet';
import { FLAGGED_FEATURE, useIsFeatureEnabled } from '../tonendpoint';
import { useStakingPools } from './useStakingPools';
import { useStakingPositions } from './useStakingPosition';

export const usePoolInfo = (poolAddress: string | undefined) => {
    const wallet = useActiveWallet();
    const api = useActiveApi();
    const network = useActiveTonNetwork();
    const isEnabled = useIsFeatureEnabled(FLAGGED_FEATURE.STAKING);

    return useQuery<PoolInfo, Error>(
        [wallet.rawAddress, QueryKey.staking, 'pool-info', poolAddress, network],
        async () => {
            const response = await new StakingApi(api.tonApiV2).getStakingPoolInfo({
                accountId: poolAddress!
            });
            return response.pool;
        },
        {
            staleTime: 60_000,
            enabled: isEnabled && !!poolAddress
        }
    );
};

export const useStakedPoolsWithInfo = () => {
    const wallet = useActiveWallet();
    const api = useActiveApi();
    const network = useActiveTonNetwork();
    const { data: positions } = useStakingPositions();
    const { data: pools } = useStakingPools();

    const positionsKey = useMemo(
        () => positions?.map(p => p.pool).join(','),
        [positions]
    );

    return useQuery<Array<{ position: AccountStakingInfo; pool: PoolInfo }>, Error>(
        [wallet.rawAddress, QueryKey.staking, 'staked-pools-with-info', network, positionsKey],
        async () => {
            const entries = await Promise.all(
                positions!.map(async position => {
                    const cachedPool = pools!.find(p => eqAddresses(p.address, position.pool));
                    if (cachedPool) {
                        return { position, pool: cachedPool };
                    }
                    const response = await new StakingApi(api.tonApiV2).getStakingPoolInfo({
                        accountId: position.pool
                    });
                    return { position, pool: response.pool };
                })
            );

            return entries;
        },
        {
            staleTime: 60_000,
            enabled: !!positions && positions.length > 0 && pools !== undefined
        }
    );
};
