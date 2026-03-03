import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { AccountStakingInfo, StakingApi } from '@tonkeeper/core/dist/tonApiV2';
import { eqAddresses } from '@tonkeeper/core/dist/utils/address';
import { QueryKey } from '../../libs/queryKey';
import { useActiveApi, useActiveWallet, useActiveTonNetwork } from '../wallet';

export const useStakingPositions = () => {
    const wallet = useActiveWallet();
    const api = useActiveApi();
    const network = useActiveTonNetwork();

    return useQuery(
        [wallet.rawAddress, QueryKey.staking, 'positions', network],
        async () => {
            const response = await new StakingApi(api.tonApiV2).getAccountNominatorsPools({
                accountId: wallet.rawAddress
            });
            return response.pools;
        },
        {
            staleTime: 60_000
        }
    );
};

export const useStakingPosition = (poolAddress: string | undefined) => {
    const { data: positions, ...rest } = useStakingPositions();

    const position = useMemo<AccountStakingInfo | undefined>(() => {
        if (!positions || !poolAddress) return undefined;
        return positions.find(p => eqAddresses(p.pool, poolAddress));
    }, [positions, poolAddress]);

    return { data: position, ...rest };
};
