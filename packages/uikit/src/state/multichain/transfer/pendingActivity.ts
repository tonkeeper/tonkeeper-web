import {
    isMultichainChain,
    MultichainActivityType,
    reportMultichainPendingTransaction
} from '@tonkeeper/core/dist/service/multichainActivityService';
import type { MultichainApiWalletCredentials } from '@tonkeeper/core/dist/service/chainkit/walletAuthService';
import { anyOfKeysParts, QueryKey } from '../../../libs/queryKey';
import type { QueryClient } from '@tanstack/react-query';

const ATTEMPT_DELAYS_MS = [0, 1000, 3000];

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Report a broadcast transaction to the backend as a pending activity,
 * retrying transient failures. Never throws into the send path — a lost
 * report only means the activity appears when the indexer catches up
 * instead of immediately.
 */
export async function registerPendingActivity(args: {
    /**
     * The wallet's backend credentials (`multichainApiWalletCredentials`).
     * Undefined (an account whose id predates format 2, or none stored)
     * skips the report — the indexer still surfaces the activity, later.
     */
    credentials: MultichainApiWalletCredentials | undefined;
    /** Asset id of the sent asset — its head names the chain and network. */
    assetId: string;
    txHash: string;
    activityType: MultichainActivityType;
    /**
     * Type-specific extras the indexer can't derive. For a swap:
     * `from_asset_id`/`to_asset_id` so the pending row can render both
     * legs before the incoming token is observable on-chain, plus
     * `from_amount`/`to_amount`/`from_address`/`aggregator` so it shows
     * amounts and files under the signing account, and `route_id` /
     * `provider_route_id` so the backend can settle the swap from the swap
     * backend and the aggregator without waiting for the webhook.
     */
    payload?: Record<string, unknown>;
}): Promise<void> {
    const credentials = args.credentials;
    if (!credentials) return;
    const [chain, network] = args.assetId.split('/');
    if (!isMultichainChain(chain)) return;
    for (const delay of ATTEMPT_DELAYS_MS) {
        if (delay > 0) await wait(delay);
        try {
            await reportMultichainPendingTransaction({
                walletId: credentials.walletId,
                walletAuthKey: credentials.walletAuthKey,
                chain,
                network: network === 'testnet' ? 'testnet' : 'mainnet',
                txHash: args.txHash,
                activityType: args.activityType,
                payload: args.payload
            });
            return;
        } catch {
            /* transient backend failure — retry, then give up silently */
        }
    }
}

/**
 * The backend needs a few blocks to observe a broadcast transaction, so
 * the immediate post-send invalidation usually refetches pre-send
 * balances and a feed without the new activity. Re-invalidate on a short
 * ladder until the indexer has had a chance to catch up (the ambient 60s
 * asset refetch interval is the backstop). Mirrors Android's
 * `PostTransactionRefreshSchedule`, which refreshes balances and the
 * asset page's history together; the last tick covers Ethereum mainnet,
 * whose blocks (and indexing) trail the other chains.
 * The wallet-assets query is wallet-wide, so a cross-chain swap's
 * destination chain is covered by the same invalidation.
 */
const POST_BROADCAST_REFRESH_DELAYS_MS = [5_000, 15_000, 45_000, 120_000];

export function schedulePostBroadcastRefresh(client: QueryClient): void {
    for (const delay of POST_BROADCAST_REFRESH_DELAYS_MS) {
        setTimeout(() => {
            void client.invalidateQueries(anyOfKeysParts(QueryKey.multichainWalletAssets));
            void client.invalidateQueries(anyOfKeysParts(QueryKey.multichainActivity));
        }, delay);
    }
}
