import { useQuery } from '@tanstack/react-query';
import { Viewport } from '@tma.js/sdk';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { Analytics, Aptabase, toWalletType } from "@tonkeeper/uikit/dist/hooks/analytics";
import { QueryKey } from '@tonkeeper/uikit/dist/libs/queryKey';
import React, { useEffect } from 'react';
import { TwaAppSdk } from './appSdk';
import { useAppSdk } from "@tonkeeper/uikit/dist/hooks/appSdk";
import { getUserOS } from "@tonkeeper/uikit/dist/libs/web";

export const ViewportContext = React.createContext<Viewport>(undefined!);

export const useTwaAppViewport = (setAppHeight: boolean, sdk: TwaAppSdk) => {
    useEffect(() => {
        const total = window.innerHeight;
        const doc = document.documentElement;

        const visualViewport = window.visualViewport;

        const setWidth = (value: number) => {
            doc.style.setProperty('--app-width', `${value}px`);
        };

        const setHeight = (value: number) => {
            const fixed = sdk.mainButton.isVisible ? value + 60 : value;
            sdk.uiEvents.emit('keyboard', {
                method: 'keyboard',
                params: { total, viewport: fixed }
            });

            //  sdk.topMessage(`${value}px`);

            if (setAppHeight) {
                doc.style.setProperty('--app-height', `${value}px`);
            } else {
                doc.style.setProperty('--app-height', `100vh`);
            }
        };

        const callback = () => {
            if (visualViewport) {
                resizeHandler.call(visualViewport);
            }
        };

        const resizeHandler = function (this: VisualViewport) {
            setHeight(this.height);
        };

        setHeight(sdk.viewport.height);
        setWidth(sdk.viewport.width);

        sdk.viewport.on('change:height', setHeight);
        sdk.viewport.on('change:width', setWidth);

        if (visualViewport) {
            visualViewport.addEventListener('resize', resizeHandler);
            window.addEventListener('resize', callback);
        }

        return () => {
            sdk.viewport.off('change:height', setHeight);
            sdk.viewport.off('change:width', setWidth);

            visualViewport?.removeEventListener('resize', resizeHandler);
            window.removeEventListener('resize', callback);
        };
    }, [sdk]);
};

export const useAnalytics = (
    activeAccount: Account | undefined,
    accounts: Account[] | undefined,
    network: Network | undefined,
    version: string
) => {
    const sdk = useAppSdk();
    return useQuery<Analytics>(
        [QueryKey.analytics, activeAccount, accounts, network],
        async () => {
            const tracker = new Aptabase({
                    host: import.meta.env.VITE_APP_APTABASE_HOST,
                    key: import.meta.env.VITE_APP_APTABASE,
                    appVersion: version,
                    sessionId: await sdk.getUserId()
                })

            tracker.init({
                application: 'Twa',
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
