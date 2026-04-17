import { FC, PropsWithChildren } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import { HideOnReview } from '../../components/ios/HideOnReview';
import { IfFeatureEnabled } from '../../components/shared/IfFeatureEnabled';
import { ErrorBoundary } from '../../components/shared/ErrorBoundary';
import { fallbackRenderOver } from '../../components/Error';
import { FLAGGED_FEATURE } from '../../state/tonendpoint';
import { StakingRoute } from '../../libs/routes';
import { useStakingEntryPoint } from '../../state/staking/useStakingEntryPoint';
import { DesktopStakingFormPage } from './DesktopStakingFormPage';
import { DesktopUnstakeFormPage } from './DesktopUnstakeFormPage';
import { DesktopStakingPoolsPage } from './DesktopStakingPoolsPage';
import { DesktopStakingPoolDetailPage } from './DesktopStakingPoolDetailPage';

const StakingDefaultView = () => {
    const entryPoint = useStakingEntryPoint();

    if (!entryPoint) return null;

    switch (entryPoint.view) {
        case 'stake-form':
            return <DesktopStakingFormPage poolAddress={entryPoint.poolAddress} />;
        case 'pool-detail':
            return <DesktopStakingPoolDetailPage poolAddress={entryPoint.poolAddress} />;
        case 'pools-list':
            return <DesktopStakingPoolsPage />;
    }
};

const StakingRouter = () => {
    const { path } = useRouteMatch();

    return (
        <Switch>
            <Route
                path={path + StakingRoute.pool + '/:address'}
                component={DesktopStakingPoolDetailPage}
            />
            <Route
                path={path + StakingRoute.stake + '/:address?'}
                component={DesktopStakingFormPage}
            />
            <Route
                path={path + StakingRoute.unstake + '/:address'}
                component={DesktopUnstakeFormPage}
            />
            <Route exact path={path} component={StakingDefaultView} />
        </Switch>
    );
};

/** Same guards as DesktopStakingPage; used by Ionic/Capacitor flat routes (see apps/mobile NarrowContent). */
export const DesktopStakingPageShell: FC<PropsWithChildren> = ({ children }) => (
    <HideOnReview>
        <IfFeatureEnabled feature={FLAGGED_FEATURE.STAKING}>
            <ErrorBoundary fallbackRender={fallbackRenderOver('Failed to display Staking page')}>
                {children}
            </ErrorBoundary>
        </IfFeatureEnabled>
    </HideOnReview>
);

/**
 * Top-level routes for IonRouterOutlet: one Route per path so nested /staking/* URLs do not
 * reuse a single /staking view (avoids Ionic stack transition early-exit / black screen).
 */
export const DesktopStakingPoolDetailIonRoute = () => (
    <DesktopStakingPageShell>
        <DesktopStakingPoolDetailPage />
    </DesktopStakingPageShell>
);

export const DesktopStakingFormIonRoute = () => (
    <DesktopStakingPageShell>
        <DesktopStakingFormPage />
    </DesktopStakingPageShell>
);

export const DesktopStakingUnstakeIonRoute = () => (
    <DesktopStakingPageShell>
        <DesktopUnstakeFormPage />
    </DesktopStakingPageShell>
);

export const DesktopStakingDefaultIonRoute = () => (
    <DesktopStakingPageShell>
        <StakingDefaultView />
    </DesktopStakingPageShell>
);

export const DesktopStakingPage = () => {
    return (
        <DesktopStakingPageShell>
            <StakingRouter />
        </DesktopStakingPageShell>
    );
};
