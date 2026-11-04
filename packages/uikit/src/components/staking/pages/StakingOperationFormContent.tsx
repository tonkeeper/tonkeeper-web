import { useParams } from '../../../hooks/router/useParams';
import {
    StakingSource,
    useStakingAnalyticsProps,
    useTrackStakingFormOpen
} from '../../../hooks/analytics/staking';
import { useStakingPools } from '../../../state/staking/useStakingPools';
import { StakingForm } from '../StakingForm';
import { UnstakeForm } from '../UnstakeForm';
import { useSyncSelectedStakingPool } from './useSyncSelectedStakingPool';

interface StakingOperationFormContentProps {
    mode: 'stake' | 'unstake';
    poolAddress?: string;
    from?: StakingSource;
}

export const StakingOperationFormContent = ({
    mode,
    poolAddress,
    from = 'staking_viewer'
}: StakingOperationFormContentProps) => {
    const { address: routeAddress } = useParams() as { address?: string };
    const address = poolAddress ?? routeAddress;

    const syncedPool = useSyncSelectedStakingPool(address);
    const { data: pools } = useStakingPools();
    // Mirrors the forms' fallback to the first pool when no address is given.
    const analyticsPool = address ? syncedPool : pools?.[0];
    const analyticsProps = useStakingAnalyticsProps(analyticsPool);
    useTrackStakingFormOpen({ isOpen: true, operation: mode, from, props: analyticsProps });

    return mode === 'stake' ? <StakingForm /> : <UnstakeForm key={address ?? 'unstake'} />;
};
