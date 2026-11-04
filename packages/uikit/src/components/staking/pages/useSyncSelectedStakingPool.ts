import { useEffect, useMemo } from 'react';
import { eqAddresses } from '@tonkeeper/core/dist/utils/address';
import { PoolInfo } from '@tonkeeper/core/dist/tonApiV2';
import { stakingSelectedPool$ } from '../../../state/staking/stakingAtoms';
import { useStakingPools } from '../../../state/staking/useStakingPools';
import { usePoolInfo } from '../../../state/staking/usePoolInfo';
import { useAtom } from '../../../libs/useAtom';

/** Selects the pool at `address` for the staking forms and returns it once resolved. */
export const useSyncSelectedStakingPool = (address?: string): PoolInfo | undefined => {
    const { data: pools } = useStakingPools();
    const { data: poolFromInfo } = usePoolInfo(address);
    const [, setSelectedPool] = useAtom(stakingSelectedPool$);

    const pool = useMemo(
        () =>
            address ? pools?.find(p => eqAddresses(p.address, address)) ?? poolFromInfo : undefined,
        [address, pools, poolFromInfo]
    );

    useEffect(() => {
        if (pool) {
            setSelectedPool(pool);
        }

        return () => setSelectedPool(undefined);
    }, [pool, setSelectedPool]);

    return pool;
};
