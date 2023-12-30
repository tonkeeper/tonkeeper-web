import { useQuery } from '@tanstack/react-query';
import { IStorage } from '@tonkeeper/core/dist/Storage';
import { AccountState } from '@tonkeeper/core/dist/entries/account';
import { WalletState } from '@tonkeeper/core/dist/entries/wallet';
import { throttle } from '@tonkeeper/core/dist/utils/common';
import { Analytics, AnalyticsGroup, toWalletType } from '@tonkeeper/uikit/dist/hooks/analytics';
import { Amplitude } from '@tonkeeper/uikit/dist/hooks/analytics/amplitude';
import { GoogleAnalytics4 } from '@tonkeeper/uikit/dist/hooks/analytics/google';
import { QueryKey } from '@tonkeeper/uikit/dist/libs/queryKey';
import { useEffect } from 'react';
import { extensionType } from './appSdk';

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

export const useAnalytics = (
    storage: IStorage,
    account?: AccountState,
    wallet?: WalletState | null
) => {
    return useQuery<Analytics>(
        [QueryKey.analytics],
        async () => {
            const tracker = new AnalyticsGroup(
                new Amplitude(process.env.REACT_APP_AMPLITUDE!),
                new GoogleAnalytics4(
                    process.env.REACT_APP_MEASUREMENT_ID!,
                    process.env.REACT_APP_GA_SECRET!,
                    storage
                )
            );

            tracker.init(extensionType ?? 'Extension', toWalletType(wallet), account, wallet);

            return tracker;
        },
        { enabled: account != null }
    );
};
