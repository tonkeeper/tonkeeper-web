import { useQuery } from '@tanstack/react-query';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { throttle } from '@tonkeeper/core/dist/utils/common';
import { Analytics, AnalyticsGroup, toWalletType } from '@tonkeeper/uikit/dist/hooks/analytics';
import { QueryKey } from '@tonkeeper/uikit/dist/libs/queryKey';
import { useEffect, useState } from 'react';
import { useActiveTonNetwork } from '@tonkeeper/uikit/dist/state/wallet';
import { CAPACITOR_APPLICATION_ID, getCapacitorDeviceOS } from './appSdk';
import { AptabaseWeb } from '@tonkeeper/uikit/dist/hooks/analytics/aptabase-web';
import { AppRoute } from '@tonkeeper/uikit/dist/libs/routes';
import { useNavigate } from '@tonkeeper/uikit/src/hooks/router/useNavigate';

export const useAppHeight = () => {
    useEffect(() => {
        const appHeight = throttle(() => {
            const doc = document.documentElement;
            doc.style.setProperty('--app-height', `${window.innerHeight}px`);
        }, 50);
        window.addEventListener('resize', appHeight);
        appHeight();

        return () => {
            window.removeEventListener('resize', appHeight);
        };
    }, []);
};

export const useAppWidth = () => {
    useEffect(() => {
        const appWidth = throttle(() => {
            const doc = document.documentElement;
            const app = (document.getElementById('root') as HTMLDivElement).childNodes.item(
                0
            ) as HTMLDivElement;

            doc.style.setProperty('--app-width', `${app.clientWidth}px`);
        }, 50);
        window.addEventListener('resize', appWidth);

        appWidth();

        return () => {
            window.removeEventListener('resize', appWidth);
        };
    }, []);
};

export const useAnalytics = (version: string, activeAccount?: Account, accounts?: Account[]) => {
    const network = useActiveTonNetwork();

    return useQuery<Analytics>(
        [QueryKey.analytics],
        async () => {
            const tracker = new AnalyticsGroup(
                new AptabaseWeb(
                    import.meta.env.VITE_APP_APTABASE_HOST,
                    import.meta.env.VITE_APP_APTABASE,
                    version
                )
            );

            tracker.init({
                application: CAPACITOR_APPLICATION_ID,
                walletType: toWalletType(activeAccount?.activeTonWallet),
                activeAccount: activeAccount!,
                accounts: accounts!,
                network,
                version,
                platform: `${CAPACITOR_APPLICATION_ID}-${await getCapacitorDeviceOS()}`
            });

            return tracker;
        },
        { enabled: accounts != null && activeAccount !== undefined }
    );
};

export const useLayout = () => {
    const navigate = useNavigate();

    const [isMobile, setMobile] = useState(localStorage.getItem('layout') === 'true');

    useEffect(() => {
        const appWidth = throttle(() => {
            if (window.innerWidth >= 1024) {
                setMobile(old => {
                    if (old !== false) {
                        navigate(AppRoute.home);
                        localStorage.setItem('layout', 'false');
                    }
                    return false;
                });
            } else {
                setMobile(old => {
                    if (old !== true) {
                        navigate(AppRoute.home);
                        localStorage.setItem('layout', 'true');
                    }
                    return true;
                });
            }
        }, 50);

        window.addEventListener('resize', appWidth);

        appWidth();

        return () => {
            window.removeEventListener('resize', appWidth);
        };
    }, [navigate, setMobile]);
    return isMobile;
};
