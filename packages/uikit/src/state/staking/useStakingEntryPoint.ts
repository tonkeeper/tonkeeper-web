import { useMemo } from 'react';
import { eqAddresses } from '@tonkeeper/core/dist/utils/address';
import { useStakingPositions } from './useStakingPosition';
import { useTonstakersPool } from './useStakingPools';
import { useJettonBalance } from '../jetton';

export type StakingEntryPoint =
    | { view: 'stake-form'; poolAddress: string }
    | { view: 'pool-detail'; poolAddress: string }
    | { view: 'pools-list' };

export const useStakingEntryPoint = (): StakingEntryPoint | undefined => {
    const { data: positions } = useStakingPositions();
    const tonstakersPool = useTonstakersPool();
    const { data: tsTonBalance, isLoading: isTsTonLoading } = useJettonBalance(
        tonstakersPool?.liquidJettonMaster
    );

    return useMemo(() => {
        if (positions === undefined || !tonstakersPool) return undefined;
        if (tonstakersPool.liquidJettonMaster && isTsTonLoading) return undefined;

        const activeNominatorPositions = positions.filter(
            p => p.amount > 0 || p.pendingDeposit > 0 || p.pendingWithdraw > 0 || p.readyWithdraw > 0
        );

        const hasTonstakersLiquid = tsTonBalance && BigInt(tsTonBalance.balance) > BigInt(0);

        const hasNonTonstakersPositions = activeNominatorPositions.some(
            p => !eqAddresses(p.pool, tonstakersPool.address)
        );

        if (!hasTonstakersLiquid && activeNominatorPositions.length === 0) {
            return { view: 'stake-form', poolAddress: tonstakersPool.address };
        }

        if (!hasNonTonstakersPositions && (hasTonstakersLiquid || activeNominatorPositions.length > 0)) {
            return { view: 'pool-detail', poolAddress: tonstakersPool.address };
        }

        return { view: 'pools-list' };
    }, [positions, tonstakersPool, tsTonBalance, isTsTonLoading]);
};
