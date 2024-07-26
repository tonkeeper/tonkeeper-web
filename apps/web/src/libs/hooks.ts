import { useQuery } from '@tanstack/react-query';
import { Account } from "@tonkeeper/core/dist/entries/account";
import { throttle } from '@tonkeeper/core/dist/utils/common';
import { Analytics, AnalyticsGroup, toWalletType } from '@tonkeeper/uikit/dist/hooks/analytics';
import { AptabaseWeb } from '@tonkeeper/uikit/dist/hooks/analytics/aptabase-web';
import { Gtag } from '@tonkeeper/uikit/dist/hooks/analytics/gtag';
import { QueryKey } from '@tonkeeper/uikit/dist/libs/queryKey';
import { useEffect } from 'react';
import { useActiveTonNetwork } from "@tonkeeper/uikit/dist/state/wallet";

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

export const useAnalytics = (
    activeAccount?: Account,
    accounts?: Account[],
    version?: string
) => {
    const network = useActiveTonNetwork();
    return useQuery<Analytics>(
        [QueryKey.analytics, network],
        async () => {
            const tracker = new AnalyticsGroup(
                new AptabaseWeb(
                    import.meta.env.VITE_APP_APTABASE_HOST,
                    import.meta.env.VITE_APP_APTABASE,
                    version
                ),
                new Gtag(import.meta.env.VITE_APP_MEASUREMENT_ID)
            );

            tracker.init({
                application: 'Web',
                walletType: toWalletType(activeAccount?.activeTonWallet),
                activeAccount: activeAccount!,
                accounts: accounts!,
                network
            }
        );

            return tracker;
        },
      { enabled: accounts != null && activeAccount !== undefined }
    );
};
