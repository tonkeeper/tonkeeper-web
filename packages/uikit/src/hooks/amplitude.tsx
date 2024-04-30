import { DAppManifest } from '@tonkeeper/core/dist/entries/tonConnect';
import React, { useCallback, useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Analytics } from './analytics';

export const useTrackLocation = () => {
    const location = useLocation();
    const tracker = useContext(AmplitudeAnalyticsContext);

    useEffect(() => {
        if (tracker) {
            tracker.pageView(location.pathname);
        }
    }, [tracker, location.pathname]);
};

export const AmplitudeAnalyticsContext = React.createContext<Analytics | undefined>(undefined);

export type AmplitudeTransactionType =
    | 'send-ton'
    | 'send-jetton'
    | 'send-nft'
    | 'renew-dns'
    | 'link-dns'
    | 'send-trc20'
    | 'multi-send-ton'
    | 'multi-send-jetton';

export const useTransactionAnalytics = () => {
    const tracker = useContext(AmplitudeAnalyticsContext);

    return useCallback(
        (kind: AmplitudeTransactionType) => {
            if (tracker) {
                tracker.track('Send_Transaction', {
                    kind
                });
            }
        },
        [tracker]
    );
};

export const useActionAnalytics = () => {
    const tracker = useContext(AmplitudeAnalyticsContext);

    return useCallback(
        (kind: string) => {
            if (tracker) {
                tracker.track('Action', {
                    kind
                });
            }
        },
        [tracker]
    );
};

export const useBuyAnalytics = () => {
    const tracker = useContext(AmplitudeAnalyticsContext);

    return useCallback(
        (kind: string) => {
            if (tracker) {
                tracker.track('Navigate_Buy', {
                    kind
                });
            }
        },
        [tracker]
    );
};

export const useOpenBrowser = () => {
    const tracker = useContext(AmplitudeAnalyticsContext);

    return useCallback(() => {
        if (tracker) {
            tracker.track('open_browser', {});
        }
    }, [tracker]);
};

export const useClickBrowser = () => {
    const tracker = useContext(AmplitudeAnalyticsContext);

    return useCallback(
        (dapp: string, source: string) => {
            if (tracker) {
                tracker.track('click_dapp', { dapp, source });
            }
        },
        [tracker]
    );
};

const getOrigin = (url: string) => {
    try {
        const item = new URL(url);
        return item.origin;
    } catch (e) {
        return url;
    }
};

export const useSendNotificationAnalytics = (manifest?: DAppManifest) => {
    return useNotificationAnalytics(
        manifest ? { kind: 'tonConnectSend', origin: getOrigin(manifest.url) } : undefined
    );
};

export const useRequestNotificationAnalytics = (manifestUrl?: string) => {
    return useNotificationAnalytics(
        manifestUrl ? { kind: 'tonConnectRequest', origin: getOrigin(manifestUrl) } : undefined
    );
};

export const useNotificationAnalytics = (item: { kind: string; origin: string } | undefined) => {
    const tracker = useContext(AmplitudeAnalyticsContext);

    useEffect(() => {
        if (tracker && item != null) {
            tracker.track('Notification', {
                name: item.kind,
                origin: item.origin
            });
        }
    }, [tracker, item]);
};
