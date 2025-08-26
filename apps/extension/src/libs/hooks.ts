import { useQuery } from '@tanstack/react-query';
import { throttle } from '@tonkeeper/core/dist/utils/common';
import { Analytics, toWalletType } from '@tonkeeper/uikit/dist/hooks/analytics';
import { QueryKey } from '@tonkeeper/uikit/dist/libs/queryKey';
import { useEffect } from 'react';
import { extensionType } from './appSdk';
import { AptabaseExtension } from './aptabase-extension';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { useActiveTonNetwork } from '@tonkeeper/uikit/dist/state/wallet';
import { TonendpointConfig } from '@tonkeeper/core/dist/tonkeeperApi/tonendpoint';

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
    config: TonendpointConfig | undefined,
    activeAccount?: Account,
    accounts?: Account[]
) => {
    const network = useActiveTonNetwork();
    return useQuery<Analytics | undefined>(
        [
            QueryKey.analytics,
            activeAccount,
            accounts,
            network,
            config?.aptabaseEndpoint,
            config?.aptabaseKey
        ],
        async () => {
            if (!config?.aptabaseEndpoint || !config?.aptabaseKey) {
                return;
            }

            const tracker = new AptabaseExtension(config.aptabaseEndpoint, config.aptabaseKey);

            tracker.init({
                application: extensionType ?? 'Extension',
                walletType: toWalletType(activeAccount?.activeTonWallet),
                activeAccount: activeAccount!,
                accounts: accounts!,
                network
            });

            return tracker;
        },
        { enabled: accounts != undefined && activeAccount != undefined && config != undefined }
    );
};
