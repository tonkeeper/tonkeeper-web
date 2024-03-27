import { useQuery } from '@tanstack/react-query';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { IStorage } from '@tonkeeper/core/dist/Storage';
import { AccountState } from '@tonkeeper/core/dist/entries/account';
import { WalletState } from '@tonkeeper/core/dist/entries/wallet';
import { throttle } from '@tonkeeper/core/dist/utils/common';
import { Analytics, AnalyticsGroup, toWalletType } from '@tonkeeper/uikit/dist/hooks/analytics';
import { Amplitude } from '@tonkeeper/uikit/dist/hooks/analytics/amplitude';
import { QueryKey } from '@tonkeeper/uikit/dist/libs/queryKey';
import { useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { extensionType } from './appSdk';
import { AptabaseExtension } from './aptabase-extension';

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
    wallet?: WalletState | null,
    version?: string
) => {
    return useQuery<Analytics>(
        [QueryKey.analytics],
        async () => {
            let userId: string | undefined = undefined;
            if (extensionType === 'FireFox') {
                userId = await storage.get<string>(AppKey.USER_ID).then(async user => {
                    if (user) {
                        return user;
                    } else {
                        const clientId = uuidv4();
                        await storage.set(AppKey.USER_ID, clientId);
                        return clientId;
                    }
                });
            }

            const tracker = new AnalyticsGroup(
                new AptabaseExtension(),
                new Amplitude(process.env.REACT_APP_AMPLITUDE!, userId)
            );

            tracker.init(extensionType ?? 'Extension', toWalletType(wallet), account, wallet);

            return tracker;
        },
        { enabled: account != null }
    );
};
