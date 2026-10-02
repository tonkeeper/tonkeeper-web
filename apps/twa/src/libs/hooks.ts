import { useQuery } from '@tanstack/react-query';
import { Viewport } from '@tma.js/sdk';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { TonendpointConfig } from '@tonkeeper/core/dist/tonkeeperApi/tonendpoint';
import {
    Analytics,
    Aptabase,
    toWalletType,
    useAnalyticsTrack
} from '@tonkeeper/uikit/dist/hooks/analytics';
import { QueryKey } from '@tonkeeper/uikit/dist/libs/queryKey';
import React, { useEffect } from 'react';
import { TwaAppSdk } from './appSdk';
import { useAppSdk } from "@tonkeeper/uikit/dist/hooks/appSdk";
import { getUserOS } from "@tonkeeper/uikit/dist/libs/web";
import { reportStubError, setStubErrorReporter } from './errorReporter';

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

/**
 * Builds the Aptabase tracker for the sunset stub. Like the web app, the
 * Aptabase endpoint and key come from the runtime Tonendpoint config rather
 * than build-time env vars. There is no active account here, so events are
 * attributed to the persistent user id and session id from the SDK identity and
 * the tracker initialises from the wallet list alone. Returns no tracker when
 * the config lacks an Aptabase key, which leaves AppContext.tracker undefined
 * and turns tracking into a no-op.
 */
export const useStubAnalytics = (
    accounts: Account[] | undefined,
    network: Network | undefined,
    version: string,
    config: TonendpointConfig | undefined
) => {
    const sdk = useAppSdk();
    return useQuery<Analytics | undefined>(
        [
            QueryKey.analytics,
            'twa-stub',
            accounts?.length ?? 0,
            network,
            config?.aptabaseEndpoint,
            config?.aptabaseKey
        ],
        async () => {
            if (!config?.aptabaseEndpoint || !config?.aptabaseKey) {
                return undefined;
            }

            const tracker = new Aptabase({
                host: config.aptabaseEndpoint,
                key: config.aptabaseKey,
                appVersion: version,
                userIdentity: sdk.userIdentity
            });

            tracker.init({
                application: 'twa',
                walletType: toWalletType(accounts?.[0]?.activeTonWallet),
                accounts: accounts ?? [],
                network,
                platform: 'twa'
            });

            return tracker;
        },
        { enabled: accounts !== undefined && config != null }
    );
};

/**
 * Routes runtime errors to the custom_error analytics event: registers the
 * module-level reporter that the top-level error boundary reads, plus global
 * listeners for uncaught errors and unhandled promise rejections.
 */
export const useTwaErrorReporting = () => {
    const track = useAnalyticsTrack();
    useEffect(() => {
        setStubErrorReporter((severity, error_message, error_code) => {
            track({
                eventName: 'custom_error',
                severity,
                error_message,
                error_code: error_code ?? null
            });
        });

        const onError = (e: ErrorEvent) => reportStubError('error', e.message);
        const onRejection = (e: PromiseRejectionEvent) => {
            const reason = e.reason;
            const message = reason instanceof Error ? reason.message : String(reason ?? 'unknown');
            reportStubError('error', message);
        };

        window.addEventListener('error', onError);
        window.addEventListener('unhandledrejection', onRejection);
        return () => {
            window.removeEventListener('error', onError);
            window.removeEventListener('unhandledrejection', onRejection);
            setStubErrorReporter(undefined);
        };
    }, [track]);
};
