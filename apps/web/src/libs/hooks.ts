import { useQuery } from '@tanstack/react-query';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { throttle } from '@tonkeeper/core/dist/utils/common';
import { Analytics, toWalletType, Aptabase } from '@tonkeeper/uikit/dist/hooks/analytics';
import { QueryKey } from '@tonkeeper/uikit/dist/libs/queryKey';
import { AppRoute } from '@tonkeeper/uikit/dist/libs/routes';
import { useActiveTonNetwork } from '@tonkeeper/uikit/dist/state/wallet';
import { useEffect, useState } from 'react';
import { useNavigate } from "@tonkeeper/uikit/dist/hooks/router/useNavigate";
import { useAppSdk } from '@tonkeeper/uikit/dist/hooks/appSdk';

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

export const useAppWidth = (standalone: boolean) => {
    useEffect(() => {
        const appWidth = throttle(() => {
            if (standalone) {
                const doc = document.documentElement;
                doc.style.setProperty('--app-width', `${window.innerWidth}px`);
            } else {
                const doc = document.documentElement;
                const app = (document.getElementById('root') as HTMLDivElement).childNodes.item(
                    0
                ) as HTMLDivElement;

                doc.style.setProperty('--app-width', `${app.clientWidth}px`);
            }
        }, 50);
        window.addEventListener('resize', appWidth);

        appWidth();

        return () => {
            window.removeEventListener('resize', appWidth);
        };
    }, [standalone]);
};

export const useAnalytics = (activeAccount: Account | undefined, accounts: Account[] | undefined, version: string) => {
    const network = useActiveTonNetwork();
    const sdk = useAppSdk();
    return useQuery<Analytics>(
        [QueryKey.analytics, network],
        async () => {
            const tracker = new Aptabase({
                  host: import.meta.env.VITE_APP_APTABASE_HOST,
                  key: import.meta.env.VITE_APP_APTABASE,
                  appVersion: version,
                  sessionId: await sdk.getUserId()
            });

            tracker.init({
                application: 'Web',
                walletType: toWalletType(activeAccount?.activeTonWallet),
                activeAccount: activeAccount!,
                accounts: accounts!,
                network
            });

            return tracker;
        },
        { enabled: accounts != null && activeAccount != null }
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
