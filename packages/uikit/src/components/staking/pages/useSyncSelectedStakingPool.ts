import { useEffect } from 'react';
import { eqAddresses } from '@tonkeeper/core/dist/utils/address';
import { stakingSelectedPool$ } from '../../../state/staking/stakingAtoms';
import { useStakingPools } from '../../../state/staking/useStakingPools';
import { usePoolInfo } from '../../../state/staking/usePoolInfo';
import { useAtom } from '../../../libs/useAtom';

export const useSyncSelectedStakingPool = (address?: string) => {
    const { data: pools } = useStakingPools();
    const { data: poolFromInfo } = usePoolInfo(address);
    const [, setSelectedPool] = useAtom(stakingSelectedPool$);

    useEffect(() => {
        if (address) {
            const pool = pools?.find(p => eqAddresses(p.address, address)) ?? poolFromInfo;
            if (pool) {
                setSelectedPool(pool);
            }
        }

        return () => setSelectedPool(undefined);
    }, [address, pools, poolFromInfo, setSelectedPool]);
};
