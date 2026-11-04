import { useCallback, useEffect, useMemo } from 'react';
import BigNumber from 'bignumber.js';
import { TrackableEvent } from './common';
import {
    toTransactionWalletInterface,
    toWalletMode,
    toWalletSource
} from '@tonkeeper/core/dist/analytics/wallet-mapping';
import {
    toAnalyticsAssetId,
    tonCoinAssetId,
    tonNftAssetId
} from '@tonkeeper/core/dist/analytics/asset-id';
import { AnalyticsEvent } from '@tonkeeper/core/dist/analytics';
import { useAnalyticsTrack } from './index';
import { SenderChoice } from '../blockchain/useSender';
import { AllChainsSenderType } from '../blockchain/sender/sender-type';
import { TRON_SENDER_TYPE } from '../blockchain/sender/useTronSender';
import { useQueryClient } from '@tanstack/react-query';
import { QueryKey } from '../../libs/queryKey';
import { useAccountsState, useActiveAccount, useActiveTonNetwork } from '../../state/wallet';
import { Asset } from '@tonkeeper/core/dist/entries/crypto/asset/asset';
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

type TransactionSentEvent = Extract<AnalyticsEvent, { eventName: 'transaction_sent' }>;

/**
 * Everything about a `transaction_sent` that only the sending flow knows. The
 * wallet-shaped fields (`wallet_interface` / `wallet_source` / `wallet_mode`)
 * are filled from the signing account, and `initiated_by` defaults to `user`
 * — every in-wallet flow is user-initiated unless it says otherwise.
 */
export type TrackTransactionSentParams = Omit<
    TransactionSentEvent,
    'eventName' | 'wallet_interface' | 'wallet_source' | 'wallet_mode' | 'initiated_by'
> &
    Partial<Pick<TransactionSentEvent, 'initiated_by'>>;

/**
 * Where a send flow was started from. The wallet's own screens all collapse into
 * `user`; the rest name the outside surface that opened the flow.
 */
export type TransferInitiatedBy = Extract<
    TransactionSentEvent['initiated_by'],
    'user' | 'deep_link' | 'qr_code'
>;

/**
 * `amount` is human-readable — the wire format is the number a user would read
 * off the screen, not the on-chain integer.
 */
export const toAnalyticsAmount = (
    smallestUnit: bigint | BigNumber | string,
    decimals: number
): number => new BigNumber(smallestUnit.toString()).shiftedBy(-decimals).toNumber();

/**
 * Asset IDs for analytics, bound to the active TON network. The network is the
 * second segment of every Asset ID, so it can't be baked into a constant.
 */
export const useAnalyticsAssetId = () => {
    const network = useActiveTonNetwork();

    return useMemo(
        () => ({
            fromAsset: (asset: Asset) => toAnalyticsAssetId(asset, network),
            tonCoin: () => tonCoinAssetId(network),
            tonNft: (address: string) => tonNftAssetId(address, network)
        }),
        [network]
    );
};

export const toAnalyticsFeeAsset = (
    senderType: AllChainsSenderType | 'multisig'
): TransactionSentEvent['fee_asset'] => {
    switch (senderType) {
        case 'external':
        case 'multisig':
        case TRON_SENDER_TYPE.TRX:
            return 'coin';
        case 'battery':
        case TRON_SENDER_TYPE.BATTERY:
            return 'battery_charges';
        case 'gasless':
            return 'gasless';
        // TON covering the fee of a TRON transaction — the one case where the
        // fee currency isn't the transaction's own chain.
        case TRON_SENDER_TYPE.TON_ASSET:
            return 'battery_ton_instant_fee';
        // Covered by the Pro subscription, i.e. sponsored for the user.
        case TRON_SENDER_TYPE.FREE_PRO:
            return 'gasless';
    }
};

export const useTrackTransactionSent = () => {
    const activeAccount = useActiveAccount();
    const accounts = useAccountsState();
    const track = useAnalyticsTrack();

    return useCallback(
        (params: TrackTransactionSentParams) => {
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
                initiated_by: 'user',
                ...params,
                // A TON contract without a version is a multisig — a smart
                // contract account rather than one of the wallet revisions.
                wallet_interface: isStandardTonWallet(signingWallet)
                    ? toTransactionWalletInterface(params.asset, signingWallet.version)
                    : 'smart_account',
                wallet_source: toWalletSource(signingAccount),
                wallet_mode: toWalletMode(signingAccount)
            });
        },
        [activeAccount, accounts, track]
    );
};

/**
 * `transaction_sent` for a TON Connect sign-raw request. The wallet signs an
 * opaque list of messages here — it knows it submitted a contract call, not what
 * the call does — so every dapp request reports as `call` / `unknown` with no
 * amount, matching the native apps.
 */
export const useTrackDappTransactionSent = () => {
    const assetId = useAnalyticsAssetId();
    const trackTransactionSent = useTrackTransactionSent();

    return useCallback(
        (params: {
            dappUrl: string;
            /** An injected dapp runs on this device; a bridged one may not. */
            connectionType: 'injected' | 'http';
            senderChoice: SenderChoice;
        }) => {
            trackTransactionSent({
                category: 'call',
                category_detail: 'unknown',
                asset: assetId.tonCoin(),
                amount: 0,
                fee_asset: toAnalyticsFeeAsset(params.senderChoice.type),
                initiated_by:
                    params.connectionType === 'injected' ? 'tonconnect_local' : 'tonconnect_remote',
                dapp_url: params.dappUrl
            });
        },
        [trackTransactionSent, assetId]
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
