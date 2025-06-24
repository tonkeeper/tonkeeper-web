import { useCallback, useEffect } from 'react';
import {
    AnalyticsEventDappBrowserOpen,
    AnalyticsEventTcRequest,
    AnalyticsEventTcSendSuccess,
    AnalyticsEventTcViewConfirm
} from '@tonkeeper/core/dist/analytics';
import { useAnalyticsTrack } from './index';
import { SenderChoice } from '../blockchain/useSender';
import { useQueryClient } from '@tanstack/react-query';
import { QueryKey } from '../../libs/queryKey';

export const useTrackTonConnectActionRequest = (dappUrl: string | undefined) => {
    const track = useAnalyticsTrack();
    useEffect(() => {
        if (dappUrl) {
            track(
                new AnalyticsEventTcViewConfirm({
                    dapp_url: dappUrl,
                    address_type: 'raw'
                })
            );
        }
    }, [track, dappUrl]);
};

export const useTrackTonConnectConnectionRequest = (dappUrl: string | undefined) => {
    const track = useAnalyticsTrack();
    useEffect(() => {
        if (dappUrl) {
            track(
                new AnalyticsEventTcRequest({
                    dapp_url: dappUrl
                })
            );
        }
    }, [track, dappUrl]);
};

export const useCountryContextTracker = () => {
    const client = useQueryClient();
    const track = useAnalyticsTrack();
    return useCallback(
        async (callback: (country: string) => void) => {
            const country: string = await client.fetchQuery([QueryKey.country]);
            callback(country);
        },
        [client, track]
    );
};

export const useTrackDappBrowserOpened = () => {
    const track = useCountryContextTracker();
    useEffect(() => {
        track(
            location =>
                new AnalyticsEventDappBrowserOpen({
                    from: 'wallet',
                    type: 'explore',
                    location
                })
        );
    }, []);
};

export const useTrackerTonConnectSendSuccess = () => {
    const track = useAnalyticsTrack();
    return useCallback((params: { dappUrl: string; sender: SenderChoice }) => {
        track(
            new AnalyticsEventTcSendSuccess({
                dapp_url: params.dappUrl,
                address_type: 'raw',
                network_fee_paid:
                    params.sender.type === 'battery'
                        ? 'battery'
                        : params.sender.type === 'gasless'
                        ? 'gasless'
                        : 'ton'
            })
        );
    }, []);
};
