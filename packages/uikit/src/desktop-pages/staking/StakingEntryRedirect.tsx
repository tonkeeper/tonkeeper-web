import { useEffect } from 'react';
import { useNavigate } from '../../hooks/router/useNavigate';
import { AppRoute, StakingRoute } from '../../libs/routes';
import { useStakingEntryPoint } from '../../state/staking/useStakingEntryPoint';

export const StakingEntryRedirect = () => {
    const entryPoint = useStakingEntryPoint();
    const navigate = useNavigate();

    useEffect(() => {
        if (!entryPoint) return;

        switch (entryPoint.view) {
            case 'stake-form':
                navigate(
                    AppRoute.staking + StakingRoute.stake + '/' + entryPoint.poolAddress,
                    { replace: true }
                );
                break;
            case 'pool-detail':
                navigate(
                    AppRoute.staking + StakingRoute.pool + '/' + entryPoint.poolAddress,
                    { replace: true }
                );
                break;
            case 'pools-list':
                navigate(AppRoute.staking + StakingRoute.pools, { replace: true });
                break;
        }
    }, [entryPoint, navigate]);

    return null;
};
