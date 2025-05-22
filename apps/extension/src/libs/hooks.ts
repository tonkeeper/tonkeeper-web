import { useQuery } from '@tanstack/react-query';
import { throttle } from '@tonkeeper/core/dist/utils/common';
import { Analytics, AnalyticsGroup, toWalletType } from '@tonkeeper/uikit/dist/hooks/analytics';
import { QueryKey } from '@tonkeeper/uikit/dist/libs/queryKey';
import { useEffect } from 'react';
import { extensionType } from './appSdk';
import { AptabaseExtension } from './aptabase-extension';
import { Account } from "@tonkeeper/core/dist/entries/account";
import { useAppSdk } from "@tonkeeper/uikit/dist/hooks/appSdk";
import { useActiveTonNetwork } from "@tonkeeper/uikit/dist/state/wallet";
import { getUserOS } from "@tonkeeper/uikit/dist/libs/web";

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
    activeAccount?: Account,
    accounts?: Account[],
) => {
  const sdk = useAppSdk();
  const network = useActiveTonNetwork();
    return useQuery<Analytics>(
        [QueryKey.analytics, activeAccount, accounts, network],
        async () => {
            const tracker = new AptabaseExtension({
              sessionId: await sdk.getUserId()
            });

            tracker.init({
              application: extensionType ?? 'Extension',
              walletType: toWalletType(activeAccount?.activeTonWallet),
              activeAccount: activeAccount!,
              accounts: accounts!,
              network
            });

            return tracker;
        },
      { enabled: accounts != undefined && activeAccount != undefined }
    );
};
