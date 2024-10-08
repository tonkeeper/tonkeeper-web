import { useMemo } from 'react';
import { AppProRoute, AppRoute } from '../../libs/routes';
import { useLocation } from 'react-router-dom';

export function useAsideActiveRoute() {
    const location = useLocation();

    return useMemo<string | undefined>(() => {
        if (location.pathname.startsWith(AppProRoute.dashboard)) {
            return AppProRoute.dashboard;
        }

        if (location.pathname.startsWith(AppRoute.settings)) {
            return AppRoute.settings;
        }

        if (location.pathname.startsWith(AppRoute.browser)) {
            return AppRoute.browser;
        }

        if (location.pathname.startsWith(AppRoute.accountSettings)) {
            return AppRoute.accountSettings;
        }

        return undefined;
    }, [location.pathname]);
}
