import { FC } from 'react';
import { useAsideActiveRoute } from '../../../hooks/desktop/useAsideActiveRoute';
import { AsideHeaderWallet } from './AsideHeaderWallet';
import { AppProRoute } from '../../../libs/routes';
import { AsideHeaderDashboard } from './AsideHeaderDashboard';
import { AsideHeaderContainer } from './AsideHeaderElements';

export const AsideHeader: FC<{ width: number }> = ({ width }) => {
    const route = useAsideActiveRoute();

    if (!route) {
        return <AsideHeaderWallet width={width} />;
    }

    if (route === AppProRoute.dashboard) {
        return <AsideHeaderDashboard width={width} />;
    }

    return <AsideHeaderContainer width={width} />;
};
