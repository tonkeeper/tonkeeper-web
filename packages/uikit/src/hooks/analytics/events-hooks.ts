import { useCallback, useEffect } from 'react';
import { TrackableEvent } from './common';
import { useAnalyticsTrack } from './index';
import { SenderChoice } from '../blockchain/useSender';
import { useQueryClient } from '@tanstack/react-query';
import { QueryKey } from '../../libs/queryKey';

export const useTrackTonConnectActionRequest = (dappUrl: string | undefined) => {
    const track = useAnalyticsTrack();
    useEffect(() => {
        if (dappUrl) {
            track({
                eventName: 'tc_view_confirm',
                dapp_url: dappUrl,
                address_type: 'raw'
            });
        }
    }, [track, dappUrl]);
};

export const useTrackTonConnectConnectionRequest = (dappUrl: string | undefined) => {
    const track = useAnalyticsTrack();
    useEffect(() => {
        if (dappUrl) {
            track({ eventName: 'tc_request', dapp_url: dappUrl });
        }
    }, [track, dappUrl]);
};

export const useCountryContextTracker = () => {
    const client = useQueryClient();
    const track = useAnalyticsTrack();
    return useCallback(
        async (map: (country: string) => TrackableEvent) => {
            const country: string = await client.fetchQuery([QueryKey.country]);
            track(map(country));
        },
        [client, track]
    );
};

export const useTrackDappBrowserOpened = () => {
    const track = useCountryContextTracker();
    useEffect(() => {
        track(location => ({
            eventName: 'dapp_browser_open',
            from: 'wallet',
            type: 'explore',
            location
        }));
    }, []);
};

export const useTrackerTonConnectSendSuccess = () => {
    const track = useAnalyticsTrack();
    return useCallback((params: { dappUrl: string; sender: SenderChoice }) => {
        track({
            eventName: 'tc_send_success',
            dapp_url: params.dappUrl,
            address_type: 'raw',
            network_fee_paid:
                params.sender.type === 'battery'
                    ? 'battery'
                    : params.sender.type === 'gasless'
                    ? 'gasless'
                    : 'ton'
        });
    }, []);
};
