import { Route, Switch, useRouteMatch } from 'react-router-dom';
import { HideOnReview } from '../../components/ios/HideOnReview';
import { IfFeatureEnabled } from '../../components/shared/IfFeatureEnabled';
import { ErrorBoundary } from '../../components/shared/ErrorBoundary';
import { fallbackRenderOver } from '../../components/Error';
import { FLAGGED_FEATURE } from '../../state/tonendpoint';
import { StakingRoute } from '../../libs/routes';
import { DesktopStakingFormPage } from './DesktopStakingFormPage';
import { DesktopUnstakeFormPage } from './DesktopUnstakeFormPage';
import { DesktopStakingPoolsPage } from './DesktopStakingPoolsPage';
import { DesktopStakingPoolDetailPage } from './DesktopStakingPoolDetailPage';
import { StakingEntryRedirect } from './StakingEntryRedirect';

const StakingRouter = () => {
    const { path } = useRouteMatch();

    return (
        <Switch>
            <Route path={path + StakingRoute.pools} component={DesktopStakingPoolsPage} />
            <Route path={path + StakingRoute.pool + '/:address'} component={DesktopStakingPoolDetailPage} />
            <Route path={path + StakingRoute.stake + '/:address?'} component={DesktopStakingFormPage} />
            <Route path={path + StakingRoute.unstake + '/:address'} component={DesktopUnstakeFormPage} />
            <Route component={StakingEntryRedirect} />
        </Switch>
    );
};

export const DesktopStakingPage = () => {
    return (
        <HideOnReview>
            <IfFeatureEnabled feature={FLAGGED_FEATURE.STAKING}>
                <ErrorBoundary fallbackRender={fallbackRenderOver('Failed to display Staking page')}>
                    <StakingRouter />
                </ErrorBoundary>
            </IfFeatureEnabled>
        </HideOnReview>
    );
};
