import { useQuery } from '@tanstack/react-query';
import { WalletsState, WalletState } from "@tonkeeper/core/dist/entries/wallet";
import { Analytics, AnalyticsGroup, toWalletType } from "@tonkeeper/uikit/dist/hooks/analytics";
import { Viewport } from '@tma.js/sdk';
import { AptabaseWeb } from '@tonkeeper/uikit/dist/hooks/analytics/aptabase-web';
import { Gtag } from '@tonkeeper/uikit/dist/hooks/analytics/gtag';
import { QueryKey } from '@tonkeeper/uikit/dist/libs/queryKey';
import React, { useEffect } from 'react';
import { TwaAppSdk } from './appSdk';

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

export const useAnalytics = (activeWallet?: WalletState, wallets?: WalletsState, version?: string) => {
    return useQuery<Analytics>(
        [QueryKey.analytics],
        async () => {
          const tracker = new AnalyticsGroup(
            new AptabaseWeb(
              import.meta.env.VITE_APP_APTABASE_HOST,
              import.meta.env.VITE_APP_APTABASE,
              version
            ),
            new Gtag(import.meta.env.VITE_APP_MEASUREMENT_ID)
          );

            tracker.init('Twa', toWalletType(activeWallet), activeWallet, wallets);

            return tracker;
        },
      { enabled: wallets != null && activeWallet !== undefined }
    );
};
