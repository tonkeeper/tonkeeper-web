import { useLocation } from 'react-router-dom';
import { useCallback, useEffect } from 'react';
import { useAppContext } from '../appContext';
import { AnalyticsTracker } from './common';

export { Aptabase } from './aptabase';
export { type Analytics, toWalletType } from './common';

export const useAnalyticsTrack = () => {
    const { tracker } = useAppContext();

    return useCallback<AnalyticsTracker>(
        async (...args) => {
            if (tracker) {
                try {
                    await tracker(...(args as Parameters<AnalyticsTracker>));
                } catch (e) {
                    console.error(e);
                }
            }
        },
        [tracker]
    );
};

export const useTrackLocation = () => {
    const location = useLocation();
    const track = useAnalyticsTrack();

    useEffect(() => {
        track('page_view', { location: location.pathname });
    }, [track, location.pathname]);
};

export type AnalyticsTransactionType =
    | 'send-ton'
    | 'send-jetton'
    | 'send-nft'
    | 'renew-dns'
    | 'link-dns'
    | 'send-trc20'
    | 'multi-send-ton'
    | 'multi-send-jetton';

export const useTransactionAnalytics = () => {
    const track = useAnalyticsTrack();

    return useCallback(
        (kind: AnalyticsTransactionType) => {
            track('Send_Transaction', {
                kind
            });
        },
        [track]
    );
};
