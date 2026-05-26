import { useCallback, useEffect } from 'react';
import { TrackableEvent } from './common';
import {
    TransactionSentEventType,
    toWalletChain,
    toWalletInterface,
    toWalletSource
} from '@tonkeeper/core/dist/analytics/wallet-mapping';
import { useAnalyticsTrack } from './index';
import { SenderChoice } from '../blockchain/useSender';
import { useQueryClient } from '@tanstack/react-query';
import { QueryKey } from '../../libs/queryKey';
import { useAccountsState, useActiveAccount } from '../../state/wallet';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { getNetworkByAccount } from '@tonkeeper/core/dist/entries/account';
import { isStandardTonWallet } from '@tonkeeper/core/dist/entries/wallet';

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
    }, [track]);
};

export const useTrackTransactionSent = () => {
    const activeAccount = useActiveAccount();
    const accounts = useAccountsState();
    const track = useAnalyticsTrack();

    return useCallback(
        (event_type: TransactionSentEventType) => {
            const hostWalletId =
                activeAccount.type === 'ton-multisig'
                    ? activeAccount.selectedHostWalletId
                    : undefined;

            const signingAccount = hostWalletId
                ? accounts.find(a => a.getTonWallet(hostWalletId) != null) ?? activeAccount
                : activeAccount;

            const signingWallet =
                (hostWalletId ? signingAccount.getTonWallet(hostWalletId) : null) ??
                signingAccount.activeTonWallet;

            track({
                eventName: 'transaction_sent',
                event_type,
                wallet_chain: toWalletChain(signingAccount),
                wallet_network:
                    getNetworkByAccount(signingAccount) === Network.TESTNET ? 'testnet' : 'mainnet',
                wallet_source: toWalletSource(signingAccount),
                wallet_interface: isStandardTonWallet(signingWallet)
                    ? toWalletInterface(signingWallet.version)
                    : null,
                wallet_chain_id: null
            });
        },
        [activeAccount, accounts, track]
    );
};

export const useTrackerTonConnectSendSuccess = () => {
    const track = useAnalyticsTrack();
    return useCallback(
        (params: { dappUrl: string; sender: SenderChoice }) => {
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
        },
        [track]
    );
};
