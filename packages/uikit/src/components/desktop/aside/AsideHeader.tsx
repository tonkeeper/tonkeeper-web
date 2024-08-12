import { FC } from 'react';
import { useAsideActiveRoute } from '../../../hooks/desktop/useAsideActiveRoute';
import { AsideHeaderWallet } from './AsideHeaderWallet';
import { AppProRoute, AppRoute } from '../../../libs/routes';
import { AsideHeaderDashboard } from './AsideHeaderDashboard';
import { AsideHeaderContainer } from './AsideHeaderElements';
import { AsideHeaderPreferences } from './AsideHeaderPreferences';
import { AsideHeaderDiscover } from './AsideHeaderDiscover';
import { ErrorBoundary } from 'react-error-boundary';
import { fallbackRenderOver } from '../../Error';

export const AsideHeaderContent: FC<{ width: number }> = ({ width }) => {
    const route = useAsideActiveRoute();

    if (!route) {
        return <AsideHeaderWallet width={width} />;
    }

    if (route === AppProRoute.dashboard) {
        return <AsideHeaderDashboard width={width} />;
    }

    if (route === AppRoute.settings) {
        return <AsideHeaderPreferences width={width} />;
    }

    if (route === AppRoute.browser) {
        return <AsideHeaderDiscover width={width} />;
    }

    return <AsideHeaderContainer width={width} />;
};

export const AsideHeader: FC<{ width: number }> = ({ width }) => {
    return (
        <ErrorBoundary fallbackRender={fallbackRenderOver('Failed to display aside header')}>
            <AsideHeaderContent width={width} />
        </ErrorBoundary>
    );
};
