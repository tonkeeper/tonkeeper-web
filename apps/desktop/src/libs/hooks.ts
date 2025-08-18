import { useQuery } from '@tanstack/react-query';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { throttle } from '@tonkeeper/core/dist/utils/common';
import { Analytics, toWalletType, Aptabase } from '@tonkeeper/uikit/dist/hooks/analytics';
import { useAppSdk } from '@tonkeeper/uikit/dist/hooks/appSdk';
import { QueryKey } from '@tonkeeper/uikit/dist/libs/queryKey';
import { useEffect } from 'react';
import { useActiveTonNetwork } from '@tonkeeper/uikit/dist/state/wallet';
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

declare const REACT_APP_APTABASE: string;

export const useAnalytics = (
    version: string,
    config: TonendpointConfig | undefined,
    activeAccount?: Account,
    accounts?: Account[]
) => {
    const sdk = useAppSdk();
    const network = useActiveTonNetwork();

    return useQuery<Analytics>(
        [QueryKey.analytics, config?.aptabaseEndpoint, config?.aptabaseKey],
        async () => {
            const tracker = new Aptabase({
                host: config!.aptabaseEndpoint,
                key: config!.aptabaseKey ?? REACT_APP_APTABASE,
                appVersion: version,
                userIdentity: sdk.userIdentity
            });

            tracker.init({
                application: 'Desktop',
                walletType: toWalletType(activeAccount.activeTonWallet),
                activeAccount,
                accounts,
                network,
                platform: `${window.backgroundApi.platform()}-${window.backgroundApi.arch()}`
            });

            return tracker;
        },
        { enabled: accounts != null && activeAccount !== undefined && config !== undefined }
    );
};
