import { useQuery } from '@tanstack/react-query';
import { AccountState } from '@tonkeeper/core/dist/entries/account';
import { WalletState } from '@tonkeeper/core/dist/entries/wallet';
import { throttle } from '@tonkeeper/core/dist/utils/common';
import { Analytics, AnalyticsGroup, toWalletType } from '@tonkeeper/uikit/dist/hooks/analytics';
import { Amplitude } from '@tonkeeper/uikit/dist/hooks/analytics/amplitude';
import { Gtag } from '@tonkeeper/uikit/dist/hooks/analytics/gtag';
import { QueryKey } from '@tonkeeper/uikit/dist/libs/queryKey';
import { useEffect } from 'react';

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

export const useAnalytics = (account?: AccountState, wallet?: WalletState | null) => {
    return useQuery<Analytics>(
        [QueryKey.analytics],
        async () => {
            const tracker = new AnalyticsGroup(
                new Amplitude(import.meta.env.VITE_APP_AMPLITUDE!),
                new Gtag(import.meta.env.VITE_APP_MEASUREMENT_ID!)
            );

            tracker.init('Web', toWalletType(wallet), account, wallet);

            return tracker;
        },
        { enabled: account != null }
    );
};
