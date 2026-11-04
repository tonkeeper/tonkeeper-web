import { Address } from '@ton/core';

import { toShortValue } from '../utils/common';
import { createMultichainAuthorizedFetch } from './chainkit/multichainApiAuth';
import {
    MultichainAssetVerification,
    toMultichainAssetVerification
} from './multichainWalletService';
import { multichainApiOrigin } from './multichainEndpoints';
import { Chain, Configuration, Network, WalletsApi } from '../multichainApiGenerated';
import type {
    Activity,
    ActivityDirection,
    ActivityStatus,
    ActivityType,
    AssetInfo
} from '../multichainApiGenerated';

/**
 * Domain aliases for the generated multichain client's enums. The OpenAPI spec
 * (see `generate:multichainApi`) is the single source of truth for these closed
 * sets — 7 chains, the classified activity kinds (send/receive/swap/stake/…),
 * pending/confirmed/failed/dropped, in/out/self. Re-exported under
 * `Multichain*` names so callers don't reach into the generated package.
 */
export type MultichainChain = Chain;
export type MultichainActivityType = ActivityType;
export type MultichainActivityStatus = ActivityStatus;
export type MultichainActivityDirection = ActivityDirection;

export function isMultichainChain(value: string): value is MultichainChain {
    return Object.values(Chain).includes(value as Chain);
}

/**
 * Token/coin descriptor carried by an activity. `assetId` is the
 * universal id (`<chain>/<network>/<type>/<address>`, e.g.
 * `eth/mainnet/coin`, `ton/mainnet/jetton/EQC…`); amounts elsewhere are
 * raw strings in this asset's smallest unit — divide by 10^`decimals`.
 */
export interface MultichainActivityAsset {
    assetId: string;
    name: string;
    symbol: string;
    decimals: number;
    image: string;
    verification: MultichainAssetVerification;
}

/**
 * A single cross-chain activity, normalized from the backend's
 * snake_case wire shape. Mirrors the model both native apps consume.
 *
 * `blockTimeMs` is Unix epoch **milliseconds** (the wire `block_time` is
 * an ISO-8601 timestamp). Amount fields (`outAmount` / `inAmount` /
 * `feeAmount`) are raw smallest-unit strings paired with their token's
 * `decimals`. `*Usd` are already-converted fiat numbers.
 */
export interface MultichainActivity {
    activityType: MultichainActivityType;
    status: MultichainActivityStatus;
    blockTimeMs: number;
    fromChain: MultichainChain;
    toChain: MultichainChain;
    direction: MultichainActivityDirection;
    /** On-chain identifiers, each formatted `chain:txhash`. */
    txIds: string[];
    /**
     * Backend-built explorer page for the primary transaction (the source
     * leg of a bridge). Absent when the indexer has no explorer for the
     * chain; the detail then shows no explorer link.
     */
    explorerUrl?: string;
    blockNumber?: number;
    walletAddress?: string;
    fromAddress?: string;
    toAddress?: string;
    /** Name currently resolving to the address (TON DNS, e.g. `alice.ton`). */
    fromName?: string;
    toName?: string;
    outToken?: MultichainActivityAsset;
    outAmount?: string;
    outAmountUsd?: number;
    inToken?: MultichainActivityAsset;
    inAmount?: string;
    inAmountUsd?: number;
    feeToken?: MultichainActivityAsset;
    feeAmount?: string;
    feeAmountUsd?: number;
    /** DEX/bridge protocol for swaps (e.g. `uniswap_v3`, `stargate`). */
    protocol?: string;
    isRead?: boolean;
    /** Backend spam classification. Rows label it in place of the status line. */
    isSpam?: boolean;
    /** Chain-specific extras (TON memo, EVM input data, …). */
    meta?: Record<string, unknown>;
}

export interface MultichainActivitiesResponse {
    activities: MultichainActivity[];
    /** Empty string means "no more pages". */
    nextCursor: string;
}

/**
 * Per-call client: the authorized fetch binds the wallet's auth headers
 * (device JWT + `X-Wallet-*`), which differ per wallet and per session.
 */
function walletsApi(
    wallet: { walletId: string; walletAuthKey?: string },
    fetchImpl?: typeof fetch
): WalletsApi {
    return new WalletsApi(
        new Configuration({
            // The generated operation paths carry the `/api/v1` prefix already.
            basePath: multichainApiOrigin(),
            fetchApi: createMultichainAuthorizedFetch(wallet, fetchImpl ?? fetch)
        })
    );
}

function toAsset(api: AssetInfo | undefined): MultichainActivityAsset | undefined {
    if (!api) return undefined;
    return {
        assetId: api.assetId,
        name: api.name,
        symbol: api.symbol,
        decimals: api.decimals,
        image: api.image,
        verification: toMultichainAssetVerification(api.verification)
    };
}

/**
 * Adapt the generated `Activity` (already decoded from the snake_case wire by
 * the client's `FromJSON`) to the app domain — chiefly folding the `blockTime`
 * `Date` down to epoch ms; every other field passes straight through.
 */
function toActivity(api: Activity): MultichainActivity {
    const ms = api.blockTime.getTime();
    return {
        activityType: api.activityType,
        status: api.status,
        blockTimeMs: Number.isNaN(ms) ? 0 : ms,
        fromChain: api.fromChain,
        toChain: api.toChain,
        direction: api.direction,
        txIds: api.txIds ?? [],
        explorerUrl: api.explorerUrl,
        blockNumber: api.blockNumber,
        walletAddress: api.walletAddress,
        fromAddress: api.fromAddress,
        toAddress: api.toAddress,
        fromName: api.from?.name || undefined,
        toName: api.to?.name || undefined,
        outToken: toAsset(api.outToken),
        outAmount: api.outAmount,
        outAmountUsd: api.outAmountUsd,
        inToken: toAsset(api.inToken),
        inAmount: api.inAmount,
        inAmountUsd: api.inAmountUsd,
        feeToken: toAsset(api.feeToken),
        feeAmount: api.feeAmount,
        feeAmountUsd: api.feeAmountUsd,
        protocol: api.protocol,
        isRead: api.isRead,
        isSpam: api.isSpam,
        meta: api.meta
    };
}

export interface ReportMultichainPendingTransactionArgs {
    walletId: string;
    walletAuthKey?: string;
    chain: MultichainChain;
    network?: Network;
    txHash: string;
    activityType: MultichainActivityType;
    /**
     * Activity-type-specific extras the indexer can't derive from the
     * transaction itself. For a swap: `from_asset_id`/`to_asset_id`
     * (without them the pending activity renders only the outgoing leg,
     * since the incoming token is unknown while pending),
     * `from_amount`/`to_amount` (base-unit integer strings — nobody else
     * knows them this early, so without them the pending swap shows no
     * amounts), `from_address` (which of the wallet's accounts signed,
     * ignored by the backend unless it is an address of this wallet),
     * `aggregator`, `route_id` (the swap backend's id of the executed
     * route) and `provider_route_id` (the aggregator's own id, e.g. the
     * swaps.xyz `txId`), which let the backend settle the swap without
     * waiting for the aggregator's webhook.
     */
    payload?: Record<string, unknown>;
    fetchImpl?: typeof fetch;
}

/**
 * Record a just-broadcast transaction on the backend
 * (`POST /wallets/{wallet_id}/transactions/pending`), so the wallet's
 * `/activities` feed shows it as `pending` immediately instead of waiting
 * for the chain indexer. Mirrors iOS `PendingTransactionsService`.
 * Failures are the caller's to absorb — the activity still appears once
 * indexed, only later.
 */
export async function reportMultichainPendingTransaction(
    args: ReportMultichainPendingTransactionArgs
): Promise<void> {
    await walletsApi(
        { walletId: args.walletId, walletAuthKey: args.walletAuthKey },
        args.fetchImpl
    ).addPendingTransactions({
        walletId: args.walletId,
        pendingTransaction: {
            chain: args.chain,
            network: args.network ?? Network.Mainnet,
            txHash: args.txHash,
            activityType: args.activityType,
            payload: args.payload
        }
    });
}

export interface GetMultichainWalletActivitiesArgs {
    walletId: string;
    walletAuthKey?: string;
    chain?: MultichainChain;
    activityType?: MultichainActivityType;
    /**
     * Spam classification filter, server-side: `true` returns only spam,
     * `false` only non-spam, omitted returns both mixed together. The feeds
     * always pass one or the other — spam is a tab of its own, never
     * interleaved with real activity.
     */
    isSpam?: boolean;
    /**
     * Narrows the page to activities moving this asset (server-side,
     * matched against the in or out token). Takes precedence over `chain`.
     */
    assetId?: string;
    /**
     * The wallet's own primary TON address. One seed can register several
     * TON wallet versions (v4R2, W5, …) under the same backend
     * `wallet_id`, and the feed returns all of them — activities of a
     * TON variant this client doesn't display are dropped so history
     * matches the balance list. Same filter as Android's
     * `filterPrimaryTonActivities`.
     */
    primaryTonAddress?: string;
    /**
     * Drop activities moving $0.01 or less (the larger of the incoming
     * and outgoing amount value; tokens the backend cannot price count
     * as dust). Server-side — the feed is cursor-paginated, so filtering
     * a fetched page here would yield short and empty pages.
     */
    hideDust?: boolean;
    limit?: number;
    cursor?: string;
    fetchImpl?: typeof fetch;
}

/** Chain segment of an asset id (`eth/mainnet/coin` → `eth`). */
export function chainOfAssetId(assetId: string): MultichainChain | undefined {
    const head = assetId.split('/')[0];
    return isMultichainChain(head) ? head : undefined;
}

export function activityInvolvesAsset(activity: MultichainActivity, assetId: string): boolean {
    return activity.outToken?.assetId === assetId || activity.inToken?.assetId === assetId;
}

/**
 * `true` when an activity belongs to a TON wallet version other than the
 * one this client displays. Non-TON and address-less activities always
 * pass; a TON `walletAddress` must equal the primary address.
 */
function belongsToForeignTonVariant(activity: MultichainActivity, primary: Address): boolean {
    if (!activity.walletAddress) return false;
    let address: Address;
    try {
        address = Address.parse(activity.walletAddress);
    } catch {
        return false;
    }
    return !address.equals(primary);
}

/**
 * Fetch one page of cross-chain activity for a multichain wallet.
 * Wraps the same endpoint iOS (`MultichainClientAPI.getWalletActivities`)
 * and Android (`WalletsApi.getWalletActivities`) consume:
 * `GET /wallets/{walletId}/activities`. Chain, type, asset, and spam
 * filters are server-enforced (with no spam filter the backend returns
 * spam and non-spam mixed); paging is cursor-based (`next_cursor`,
 * empty ⇒ end).
 */
export async function getMultichainWalletActivities(
    args: GetMultichainWalletActivitiesArgs
): Promise<MultichainActivitiesResponse> {
    const response = await walletsApi(
        { walletId: args.walletId, walletAuthKey: args.walletAuthKey },
        args.fetchImpl
    ).getWalletActivities({
        walletId: args.walletId,
        chain: args.assetId ? undefined : args.chain,
        activityType: args.activityType,
        assetId: args.assetId,
        isSpam: args.isSpam,
        // `false` is the backend default — transmitted as omission, like iOS.
        hideDust: args.hideDust || undefined,
        limit: args.limit,
        cursor: args.cursor
    });
    let activities = (response.activities ?? []).map(toActivity);
    if (args.primaryTonAddress) {
        try {
            const primary = Address.parse(args.primaryTonAddress);
            activities = activities.filter(a => !belongsToForeignTonVariant(a, primary));
        } catch {
            // An unparseable primary address must not blank the feed.
        }
    }
    return {
        activities,
        nextCursor: response.nextCursor ?? ''
    };
}

/**
 * Split a `chain:txhash` id into its parts. The hash itself never
 * contains a colon, so we split on the first one only.
 */
export function parseTxId(txId: string): { chain: string; hash: string } {
    const idx = txId.indexOf(':');
    if (idx === -1) return { chain: '', hash: txId };
    return { chain: txId.slice(0, idx), hash: txId.slice(idx + 1) };
}

export interface MultichainTransactionId {
    chain: string;
    hash: string;
    /**
     * Head…tail label form, sized the way each ecosystem abbreviates a hash:
     * `0x1234…5678` for `0x`-prefixed EVM hashes, `1a2b3c4d…5e6f7a8b` for
     * the prefix-less TON, BTC and TRON hashes (the legacy TON history
     * sheet and Tonviewer use eight). Both natives show the first eight
     * characters instead, which on EVM chains reads as an implausibly
     * short hash.
     */
    shortHash: string;
}

/**
 * The on-chain id to display for an activity: each `txIds` entry is
 * trimmed and empties dropped, the source-chain id is preferred (a
 * cross-chain swap carries one per leg), any remaining id is the
 * fallback. `undefined` when the activity carries no usable id — e.g.
 * one still pending on a chain whose hash the backend hasn't seen.
 */
export function transactionIdForActivity(
    activity: MultichainActivity
): MultichainTransactionId | undefined {
    const ids = activity.txIds
        .map(parseTxId)
        .map(t => ({ chain: t.chain, hash: t.hash.trim() }))
        .filter(t => t.hash !== '');
    const match = ids.find(t => t.chain === activity.fromChain) ?? ids[0];
    if (!match) return undefined;
    return { ...match, shortHash: toShortValue(match.hash, /^0x/i.test(match.hash) ? 4 : 8) };
}

export interface MultichainExplorerLink {
    url: string;
    hash: string;
    shortHash: string;
}

/**
 * The explorer link to show on a transaction detail. The URL comes solely
 * from the backend, which owns the per-chain explorer choice (Blockscout
 * for EVM chains, not Etherscan), so the client never composes one from
 * a hash. Requires a resolvable transaction id for the hash label and,
 * as on iOS, only opens web URLs — anything else the backend might send
 * is treated as no link.
 */
export function explorerLinkForActivity(
    activity: MultichainActivity
): MultichainExplorerLink | undefined {
    const url = activity.explorerUrl?.trim();
    if (!url || !/^https?:\/\//i.test(url)) return undefined;
    const id = transactionIdForActivity(activity);
    if (!id) return undefined;
    return { url, hash: id.hash, shortHash: id.shortHash };
}

/**
 * Full display address for a counterparty. TON addresses are rendered in
 * the user-facing non-bounceable friendly form (matching iOS
 * `MultichainAddressFormatter`); every other chain uses the address
 * as-is. Unparseable TON input falls back to the raw string.
 */
export function formatMultichainAddress(address: string, chain: string): string {
    if (chain === 'ton') {
        try {
            return Address.parse(address).toString({ bounceable: false, testOnly: false });
        } catch {
            return address;
        }
    }
    return address;
}

/**
 * Short `1234…5678` form for list rows, applied on top of the
 * chain-aware full format.
 */
export function shortenMultichainAddress(address: string, chain: string): string {
    return toShortValue(formatMultichainAddress(address, chain));
}
