import { useParams } from '../../../hooks/router/useParams';
import { StakingForm } from '../StakingForm';
import { UnstakeForm } from '../UnstakeForm';
import { useSyncSelectedStakingPool } from './useSyncSelectedStakingPool';

interface StakingOperationFormContentProps {
    mode: 'stake' | 'unstake';
    poolAddress?: string;
}

export const StakingOperationFormContent = ({
    mode,
    poolAddress
}: StakingOperationFormContentProps) => {
    const { address: routeAddress } = useParams() as { address?: string };
    const address = poolAddress ?? routeAddress;

    useSyncSelectedStakingPool(address);

    return mode === 'stake' ? <StakingForm /> : <UnstakeForm />;
};
