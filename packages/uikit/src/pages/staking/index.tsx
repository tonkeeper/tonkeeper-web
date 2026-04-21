import { Route, Switch, useRouteMatch } from 'react-router-dom';
import { HideOnReview } from '../../components/ios/HideOnReview';
import { IfFeatureEnabled } from '../../components/shared/IfFeatureEnabled';
import { ErrorBoundary } from '../../components/shared/ErrorBoundary';
import { fallbackRenderOver } from '../../components/Error';
import { FLAGGED_FEATURE } from '../../state/tonendpoint';
import { StakingRoute } from '../../libs/routes';
import { useStakingEntryPoint } from '../../state/staking/useStakingEntryPoint';
import { StakingFormPage } from './StakingFormPage';
import { UnstakeFormPage } from './UnstakeFormPage';
import { StakingPoolsPage } from './StakingPoolsPage';
import { StakingPoolDetailPage } from './StakingPoolDetailPage';

const StakingDefaultView = () => {
    const entryPoint = useStakingEntryPoint();

    if (!entryPoint) return null;

    switch (entryPoint.view) {
        case 'stake-form':
            return <StakingFormPage poolAddress={entryPoint.poolAddress} />;
        case 'pool-detail':
            return <StakingPoolDetailPage poolAddress={entryPoint.poolAddress} />;
        case 'pools-list':
            return <StakingPoolsPage />;
    }
};

const StakingRouter = () => {
    const { path } = useRouteMatch();

    return (
        <Switch>
            <Route
                path={path + StakingRoute.pool + '/:address'}
                component={StakingPoolDetailPage}
            />
            <Route path={path + StakingRoute.stake + '/:address?'} component={StakingFormPage} />
            <Route path={path + StakingRoute.unstake + '/:address'} component={UnstakeFormPage} />
            <Route exact path={path} component={StakingDefaultView} />
        </Switch>
    );
};

export const StakingPage = () => {
    return (
        <HideOnReview>
            <IfFeatureEnabled feature={FLAGGED_FEATURE.STAKING}>
                <ErrorBoundary
                    fallbackRender={fallbackRenderOver('Failed to display Staking page')}
                >
                    <StakingRouter />
                </ErrorBoundary>
            </IfFeatureEnabled>
        </HideOnReview>
    );
};

export default StakingPage;
