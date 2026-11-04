import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ChainId, ensureReady, getAdapter } from '@tonkeeper/core/dist/chains';
import {
    estimateMultichainTransfer,
    MultichainTransferEstimation,
    MultichainTransferInput,
    sendMultichainTransfer
} from '@tonkeeper/core/dist/service/chainkit/multichainTransferService';
import { multichainApiWalletCredentials } from '@tonkeeper/core/dist/service/chainkit/walletAuthService';

import { normalizeAnalyticsAssetId } from '@tonkeeper/core/dist/analytics/asset-id';

import { QueryKey, anyOfKeysParts } from '../../../libs/queryKey';
import { registerPendingActivity, schedulePostBroadcastRefresh } from './pendingActivity';
import {
    toAnalyticsAmount,
    TransferInitiatedBy,
    useTrackTransactionSent
} from '../../../hooks/analytics/events-hooks';
import { useAppSdk } from '../../../hooks/appSdk';
import { useActiveAccount } from '../../wallet';
import { getAccountSecret } from '../../mnemonic';

/**
 * Synchronous per-chain address validator (chain-kit address parsing).
 * Returns `false` until chain-kit has finished its async lifecycle —
 * `ensureReady()` is fired once on mount so the first real keystroke
 * validates. EVM networks (eth/base/bsc/arb) share one address format,
 * so the coarse `ChainId` is the right granularity here.
 */
export const useChainAddressValidator = (chain: ChainId): ((address: string) => boolean) => {
    return useCallback(
        (address: string) => {
            if (!address) return false;
            try {
                return getAdapter(chain).validateAddress(address.trim());
            } catch {
                return false;
            }
        },
        [chain]
    );
};

/**
 * Warm chain-kit's lifecycle so the synchronous validator above works,
 * and report whether it has finished. The validator returns `false` for
 * every address until this resolves (chain-kit's `Address` class isn't
 * loaded yet), so callers must hold off on surfacing an "invalid address"
 * error while `ready` is still `false`.
 */
export const useEnsureChainKitReady = (): boolean => {
    const { data } = useQuery(
        [QueryKey.multichainWalletAssets, 'chainkit-ready'],
        () => ensureReady().then(() => true),
        {
            staleTime: Infinity,
            cacheTime: Infinity
        }
    );
    return data === true;
};

export interface MultichainEstimateArgs {
    input: MultichainTransferInput | undefined;
    enabled: boolean;
}

export const useMultichainEstimateTransfer = ({ input, enabled }: MultichainEstimateArgs) =>
    useQuery<MultichainTransferEstimation, Error>(
        [
            QueryKey.estimate,
            'multichain',
            input?.asset.assetId,
            input?.toAddress,
            input?.amount.toString(),
            input?.isMax
        ],
        () => estimateMultichainTransfer(input!),
        { enabled: enabled && !!input, retry: false, keepPreviousData: true }
    );

export const useMultichainSendTransfer = () => {
    const sdk = useAppSdk();
    const account = useActiveAccount();
    const client = useQueryClient();
    const trackTransactionSent = useTrackTransactionSent();

    return useMutation<
        { hash: string },
        Error,
        MultichainTransferInput & { initiatedBy?: TransferInitiatedBy }
    >(async ({ initiatedBy, ...input }) => {
        const secret = await getAccountSecret(sdk, account.id);
        if (secret.type !== 'mnemonic') {
            throw new Error('Multichain send requires a mnemonic account');
        }
        const result = await sendMultichainTransfer({ ...input, mnemonic: secret.mnemonic });

        trackTransactionSent({
            category: 'transfer',
            category_detail: input.asset.isNative ? 'coin' : 'token',
            asset: normalizeAnalyticsAssetId(input.asset.assetId),
            amount: toAnalyticsAmount(input.amount, input.asset.decimals),
            // Chain-kit signs and pays with the chain's own native coin on every
            // chain it supports — battery and gasless are TON-only relay paths
            // that this send doesn't go through.
            fee_asset: 'coin',
            is_max: input.isMax,
            initiated_by: initiatedBy
        });

        // Not awaited: the pending report must not delay (or fail) the
        // success state. History refreshes once the report lands, so the
        // refetch actually sees the pending row.
        void registerPendingActivity({
            credentials: multichainApiWalletCredentials(account),
            assetId: input.asset.assetId,
            txHash: result.hash,
            activityType: 'send'
        }).then(() => client.invalidateQueries(anyOfKeysParts(QueryKey.multichainActivity)));

        await client.invalidateQueries(anyOfKeysParts(QueryKey.multichainWalletAssets));
        schedulePostBroadcastRefresh(client);
        return result;
    });
};
