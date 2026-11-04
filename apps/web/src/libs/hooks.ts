import { useQuery } from '@tanstack/react-query';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { throttle } from '@tonkeeper/core/dist/utils/common';
import { Analytics, toWalletType, Aptabase } from '@tonkeeper/uikit/dist/hooks/analytics';
import { QueryKey } from '@tonkeeper/uikit/dist/libs/queryKey';
import { AppRoute } from '@tonkeeper/uikit/dist/libs/routes';
import { useActiveTonNetwork } from '@tonkeeper/uikit/dist/state/wallet';
import { useEffect, useState } from 'react';
import { useNavigate } from '@tonkeeper/uikit/dist/hooks/router/useNavigate';
import { useAppSdk } from '@tonkeeper/uikit/dist/hooks/appSdk';
import { TonendpointConfig } from '@tonkeeper/core/dist/tonkeeperApi/tonendpoint';

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
                // Root's first child can be missing for a tick while a
                // Suspense fallback is `null` (multichain portfolio path
                // does this). Skip the measurement and let the next
                // resize event pick it up.
                const app = document
                    .getElementById('root')
                    ?.childNodes.item(0) as HTMLDivElement | null;
                if (!app) return;

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

export const useAnalytics = (
    activeAccount: Account | undefined,
    accounts: Account[] | undefined,
    version: string,
    config: TonendpointConfig | undefined
) => {
    const network = useActiveTonNetwork();
    const sdk = useAppSdk();

    return useQuery<Analytics | null>(
        [QueryKey.analytics, network, config?.aptabaseEndpoint, config?.aptabaseKey],
        async () => {
            if (!config?.aptabaseEndpoint || !config?.aptabaseKey) {
                // react-query rejects `undefined` as query data with
                // "Query data cannot be undefined". `null` is allowed.
                return null;
            }

            const tracker = new Aptabase({
                host: config.aptabaseEndpoint,
                key: config.aptabaseKey,
                appVersion: version,
                userIdentity: sdk.userIdentity
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

    // Taken from the window rather than remembered from the last visit: a
    // remembered layout that no longer fits — or none at all, on a fresh
    // profile — read as a switch on the first pass below and sent the visit
    // home, dropping the deeplink it arrived on.
    const [isMobile, setMobile] = useState(() => window.innerWidth < 1024);

    useEffect(() => {
        const appWidth = throttle(() => {
            if (window.innerWidth >= 1024) {
                setMobile(old => {
                    if (old !== false) {
                        navigate(AppRoute.home);
                    }
                    return false;
                });
            } else {
                setMobile(old => {
                    if (old !== true) {
                        navigate(AppRoute.home);
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
