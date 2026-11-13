import { useMemo, useRef } from 'react';
import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
    createCrossSwapQuote,
    CrossSwapApprovalMode,
    crossSwapQuoteRequestOptions,
    fetchCrossSwapAsset,
    fetchCrossSwapAssets,
    fetchCrossSwapConfig,
    prepareCrossSwapRoute
} from '@tonkeeper/core/dist/swapsApi';
import type {
    CreateCrossSwapQuoteRequest,
    CrossSwapAsset,
    CrossSwapConfig,
    CrossSwapDefaultPair,
    CrossSwapPrepare,
    CrossSwapQuote,
    CrossSwapRoute
} from '@tonkeeper/core/dist/swapsApi';
import {
    estimateMultichainSwap,
    executeMultichainSwap,
    isChainKitSwapAsset,
    MultichainSwapEstimation,
    MultichainSwapWalletAddresses,
    swapWalletAddress
} from '@tonkeeper/core/dist/service/chainkit/multichainSwapService';
import { multichainApiWalletCredentials } from '@tonkeeper/core/dist/service/chainkit/walletAuthService';
import type { Account } from '@tonkeeper/core/dist/entries/account';

import { useAppSdk } from '../../../hooks/appSdk';
import { useAnalyticsTrack } from '../../../hooks/analytics';
import { runSwapRedOperation, toSwapAnalyticsAssetId } from '../../../hooks/analytics/swap';
import { anyOfKeysParts, QueryKey } from '../../../libs/queryKey';
import { registerPendingActivity, schedulePostBroadcastRefresh } from '../transfer/pendingActivity';
import { getAccountSecret } from '../../mnemonic';
import { useSwapsConfig } from '../../swap/useSwapsConfig';
import { useActiveAccount } from '../../wallet';

export const useMultichainSwapAddresses = (): MultichainSwapWalletAddresses | undefined => {
    const account = useActiveAccount();
    return useMemo(() => {
        if (account.type !== 'multichain') return undefined;
        const evm = account.getWalletByChain('evm');
        const btc = account.getWalletByChain('btc');
        const tron = account.getWalletByChain('tron');
        if (!evm || !btc || !tron) return undefined;
        return {
            ton: account.activeTonWallet.rawAddress,
            evm: evm.rawAddress,
            btc: btc.rawAddress,
            tron: tron.rawAddress
        };
    }, [account]);
};

const isSwappableHere = (
    asset: CrossSwapAsset,
    addresses: MultichainSwapWalletAddresses | undefined
): boolean => {
    if (!isChainKitSwapAsset(asset)) return false;
    try {
        return !!addresses && !!swapWalletAddress(asset.chainId, addresses);
    } catch {
        return false;
    }
};

export const useCrossSwapAssets = () => {
    const { baseUrl, queryParams } = useSwapsConfig();
    const addresses = useMultichainSwapAddresses();
    return useQuery<CrossSwapAsset[], Error>(
        [QueryKey.crossSwapAssets, baseUrl, queryParams],
        async () => {
            const assets = await fetchCrossSwapAssets(baseUrl, { limit: 1000 }, queryParams);
            return assets.filter(asset => isSwappableHere(asset, addresses));
        },
        {
            enabled: !!baseUrl && !!addresses,
            staleTime: 5 * 60_000,
            retry: false
        }
    );
};

/**
 * A single catalog asset the capped list may not include. `null` when the
 * catalog doesn't list it or this wallet can't swap on its chain.
 */
export const useCrossSwapAsset = (assetId: string | undefined) => {
    const { baseUrl, queryParams } = useSwapsConfig();
    const addresses = useMultichainSwapAddresses();
    return useQuery<CrossSwapAsset | null, Error>(
        [QueryKey.crossSwapAsset, baseUrl, queryParams, assetId],
        async () => {
            const asset = await fetchCrossSwapAsset(baseUrl, assetId!, queryParams);
            if (!asset) return null;
            return isSwappableHere(asset, addresses) ? asset : null;
        },
        {
            enabled: !!baseUrl && !!addresses && !!assetId,
            staleTime: 5 * 60_000,
            retry: false
        }
    );
};

export interface CrossSwapPairSelection {
    fromAssetId?: string;
    toAssetId?: string;
}

/**
 * The backend-chosen opening pair, with one side optionally pinned to the
 * asset the user tapped. `null` when either side can't be swapped from this
 * wallet, so the form falls back to its local defaults. Pass `undefined`
 * while the pinned side is still being resolved.
 */
export interface WalletCrossSwapConfig extends Omit<CrossSwapConfig, 'defaultPair'> {
    /** `null` when the backend's pair has a side this wallet cannot swap. */
    defaultPair: CrossSwapDefaultPair | null;
}

export const useCrossSwapConfig = (selection: CrossSwapPairSelection | undefined) => {
    const { baseUrl, queryParams } = useSwapsConfig();
    const addresses = useMultichainSwapAddresses();
    const account = useActiveAccount();
    const walletId = multichainApiWalletCredentials(account)?.walletId;
    return useQuery<WalletCrossSwapConfig, Error>(
        [QueryKey.crossSwapConfig, baseUrl, queryParams, walletId, selection],
        async () => {
            const config = await fetchCrossSwapConfig(baseUrl, walletId!, selection!, queryParams);
            const pair = config.defaultPair;
            return {
                ...config,
                defaultPair:
                    isSwappableHere(pair.sourceAsset, addresses) &&
                    isSwappableHere(pair.destinationAsset, addresses)
                        ? pair
                        : null
            };
        },
        {
            enabled: !!baseUrl && !!addresses && !!walletId && !!selection,
            staleTime: 60_000,
            retry: false
        }
    );
};

/**
 * Server-side catalog search for the asset picker: the capped list the
 * picker opens with covers the head of the catalog only, so typed queries
 * and chain filters go to the backend like the native apps' pickers do.
 * `chainId` is the asset id head (`eth/mainnet`), the backend's chain key.
 */
export const useCrossSwapAssetSearch = (query: string, chainId?: string) => {
    const { baseUrl, queryParams } = useSwapsConfig();
    const addresses = useMultichainSwapAddresses();
    return useQuery<CrossSwapAsset[], Error>(
        [QueryKey.crossSwapAssets, 'search', baseUrl, queryParams, query, chainId],
        async () => {
            const assets = await fetchCrossSwapAssets(
                baseUrl,
                { q: query || undefined, limit: query ? 100 : 1000, chain: chainId },
                queryParams
            );
            return assets.filter(asset => isSwappableHere(asset, addresses));
        },
        {
            enabled: !!baseUrl && !!addresses && (query.length > 0 || !!chainId),
            keepPreviousData: true,
            staleTime: 60_000,
            retry: false
        }
    );
};

export interface CrossSwapQuoteArgs {
    sourceAsset: CrossSwapAsset | undefined;
    destinationAsset: CrossSwapAsset | undefined;
    sourceAmount: string | undefined;
    slippageBps: number;
    /**
     * The amount is the MAX fill. It lets an aggregator that takes its fee out
     * of the source amount quote the whole balance rather than fail on it.
     */
    isMax?: boolean;
    /** Freeze the quote (no fetch, no 30s refresh) — e.g. once the swap is sent. */
    paused?: boolean;
}

/** A quote is re-requested this often while the swap is being set up. */
export const CROSS_SWAP_QUOTE_REFETCH_MS = 30_000;

export const useCrossSwapQuote = (args: CrossSwapQuoteArgs) => {
    const { baseUrl, queryParams } = useSwapsConfig();
    const sdk = useAppSdk();
    const addresses = useMultichainSwapAddresses();
    const account = useActiveAccount();
    const walletId = multichainApiWalletCredentials(account)?.walletId;
    const request = useMemo<CreateCrossSwapQuoteRequest | undefined>(() => {
        if (!addresses || !args.sourceAsset || !args.destinationAsset || !args.sourceAmount) {
            return undefined;
        }
        return {
            sourceAsset: args.sourceAsset.assetId,
            sourceAmount: args.sourceAmount,
            destinationAsset: args.destinationAsset.assetId,
            senderAddress: swapWalletAddress(args.sourceAsset.chainId, addresses),
            recipientAddress: swapWalletAddress(args.destinationAsset.chainId, addresses),
            slippageBps: args.slippageBps,
            exactType: 'exact_input',
            ...(args.isMax && { isMax: true }),
            ...crossSwapQuoteRequestOptions(args.sourceAsset.chainId)
        };
    }, [addresses, args]);
    const track = useAnalyticsTrack();
    // The background refresh of a request that was already priced is not a
    // new attempt: as on the native apps, one quote operation covers one
    // request the user made, settled by its first answer.
    const pricedRequestKey = useRef<string>();

    return useQuery<CrossSwapQuote, Error>(
        [QueryKey.crossSwapQuote, baseUrl, walletId, request],
        context => {
            const fetchQuote = async () =>
                createCrossSwapQuote(
                    baseUrl,
                    request!,
                    queryParams,
                    walletId,
                    await sdk.userIdentity.getPersistentUserId()
                );
            const requestKey = JSON.stringify(context.queryKey);
            if (pricedRequestKey.current === requestKey) return fetchQuote();
            return runSwapRedOperation(
                track,
                {
                    operation: 'quote',
                    errorType: 'native_swap',
                    // Read only for a tracked request: reading the signal
                    // makes react-query drop a request nothing waits for.
                    signal: context.signal,
                    metadata: {
                        from_asset: toSwapAnalyticsAssetId(request!.sourceAsset),
                        to_asset: toSwapAnalyticsAssetId(request!.destinationAsset),
                        from_amount: request!.sourceAmount,
                        is_max: request!.isMax
                    }
                },
                async () => {
                    const quote = await fetchQuote();
                    pricedRequestKey.current = requestKey;
                    return quote;
                }
            );
        },
        {
            enabled: !args.paused && !!baseUrl && !!request && request.sourceAmount !== '0',
            keepPreviousData: true,
            refetchInterval: args.paused ? false : CROSS_SWAP_QUOTE_REFETCH_MS,
            // The interval skips its ticks while the tab is hidden, so a quote
            // that aged past one interval meanwhile is renewed on return
            // rather than up to a full interval later.
            refetchOnWindowFocus: query =>
                Date.now() - Math.max(query.state.dataUpdatedAt, query.state.errorUpdatedAt) >=
                CROSS_SWAP_QUOTE_REFETCH_MS,
            retry: false
        }
    );
};

/**
 * The signing payloads of a route. A quote is requested with its payloads
 * inline, and those are used as-is, like on the native apps; the prepare
 * endpoint is called only for a route that came without them, or when the
 * user asks for an unlimited approval — the inline payloads carry the
 * default exact one and the approval mode is applied server-side.
 */
export const usePrepareCrossSwap = (
    route: CrossSwapRoute | undefined,
    approvalMode: (typeof CrossSwapApprovalMode)[keyof typeof CrossSwapApprovalMode],
    enabled: boolean
) => {
    const { baseUrl, queryParams } = useSwapsConfig();
    const sdk = useAppSdk();
    const account = useActiveAccount();
    const walletId = multichainApiWalletCredentials(account)?.walletId;
    const inline =
        route?.payloads?.length && approvalMode === CrossSwapApprovalMode.Exact
            ? {
                  routeId: route.routeId,
                  aggregator: route.aggregator,
                  payloads: route.payloads,
                  providerRouteId: route.providerRouteId
              }
            : undefined;
    return useQuery<CrossSwapPrepare, Error>(
        [QueryKey.crossSwapPrepare, baseUrl, walletId, route?.routeId, approvalMode, !!inline],
        async () =>
            inline ??
            prepareCrossSwapRoute(
                baseUrl,
                route!.routeId,
                approvalMode,
                queryParams,
                walletId,
                await sdk.userIdentity.getPersistentUserId()
            ),
        { enabled: enabled && !!baseUrl && !!route, retry: false }
    );
};

export const useEstimateCrossSwap = (args: {
    sourceAsset: CrossSwapAsset | undefined;
    destinationAsset: CrossSwapAsset | undefined;
    route: CrossSwapRoute | undefined;
    prepared: CrossSwapPrepare | undefined;
    unlimitedApproval: boolean;
    isMax: boolean;
    enabled: boolean;
}) => {
    const addresses = useMultichainSwapAddresses();
    const track = useAnalyticsTrack();
    return useQuery<MultichainSwapEstimation, Error>(
        [
            QueryKey.estimate,
            'cross-swap',
            args.prepared?.routeId,
            args.prepared?.payloads.map(p => p.payloadId).join(','),
            args.route,
            args.unlimitedApproval,
            args.isMax
        ],
        ({ signal }) =>
            runSwapRedOperation(
                track,
                {
                    operation: 'emulate',
                    errorType: 'fee_calculation_failed',
                    signal,
                    metadata: {
                        from_asset: toSwapAnalyticsAssetId(args.sourceAsset!.assetId),
                        to_asset: toSwapAnalyticsAssetId(args.destinationAsset!.assetId),
                        provider: args.route!.aggregator,
                        fee_paid_in: 'coin'
                    },
                    // The flat default fee that stands in for a failed estimate
                    // is not shown as a fee, so the screen treats it as a failure.
                    failureOf: estimation =>
                        estimation.estimated
                            ? undefined
                            : {
                                  type: 'fee_calculation_failed',
                                  message: 'Fee estimate unavailable'
                              }
                },
                () =>
                    estimateMultichainSwap({
                        sourceAsset: args.sourceAsset!,
                        destinationAsset: args.destinationAsset!,
                        sourceAddress: swapWalletAddress(args.sourceAsset!.chainId, addresses!),
                        destinationAddress: swapWalletAddress(
                            args.destinationAsset!.chainId,
                            addresses!
                        ),
                        prepared: args.prepared!,
                        route: args.route!,
                        unlimitedApproval: args.unlimitedApproval,
                        isMax: args.isMax
                    })
            ),
        {
            enabled:
                args.enabled &&
                !!addresses &&
                !!args.sourceAsset &&
                !!args.destinationAsset &&
                !!args.route &&
                !!args.prepared,
            retry: false
        }
    );
};

/**
 * Files the broadcast legs of a swap as pending history rows. Not awaited by
 * callers: the report must not delay or fail the swap result; history
 * refreshes once it lands. The route is the only party that knows both
 * legs' base-unit amounts before the swap is indexed, and the signing
 * address files the row under the right wallet on chains with several.
 * The route ids let the backend settle the swap directly, from the swap
 * backend by `route_id` and from the aggregator by `provider_route_id`,
 * instead of waiting for the aggregator's webhook. A prepare call can mint
 * the aggregator's id anew, so the prepared one wins over the quote's.
 */
export const reportPendingSwap = (
    client: QueryClient,
    account: Account,
    args: {
        sourceAsset: CrossSwapAsset;
        destinationAsset: CrossSwapAsset;
        sourceAddress: string;
        /** Swap-backend id of the prepared route the broadcast payloads came from. */
        routeId: string;
        /** The aggregator's id of the prepared route, when the prepare minted one. */
        providerRouteId?: string;
        route?: CrossSwapRoute;
        hashes: string[];
    }
): void => {
    const providerRouteId = args.providerRouteId ?? args.route?.providerRouteId;
    void Promise.all(
        args.hashes.map(hash =>
            registerPendingActivity({
                credentials: multichainApiWalletCredentials(account),
                assetId: args.sourceAsset.assetId,
                txHash: hash,
                activityType: 'swap',
                payload: {
                    from_asset_id: args.sourceAsset.assetId,
                    to_asset_id: args.destinationAsset.assetId,
                    from_address: args.sourceAddress,
                    route_id: args.routeId,
                    ...(args.route?.aggregator && { aggregator: args.route.aggregator }),
                    ...(providerRouteId && { provider_route_id: providerRouteId }),
                    ...(args.route?.sourceAmount && { from_amount: args.route.sourceAmount }),
                    ...(args.route?.estimatedDestinationAmount && {
                        to_amount: args.route.estimatedDestinationAmount
                    })
                }
            })
        )
    ).then(() => client.invalidateQueries(anyOfKeysParts(QueryKey.multichainActivity)));
};

export const useExecuteCrossSwap = () => {
    const sdk = useAppSdk();
    const account = useActiveAccount();
    const addresses = useMultichainSwapAddresses();
    const client = useQueryClient();

    return useMutation<
        { hashes: string[] },
        Error,
        {
            sourceAsset: CrossSwapAsset;
            destinationAsset: CrossSwapAsset;
            prepared: CrossSwapPrepare;
            /** The quoted route the user confirmed and the prepare came from. */
            route: CrossSwapRoute;
            unlimitedApproval: boolean;
            isMax?: boolean;
        }
    >(async args => {
        if (!addresses || account.type !== 'multichain') {
            throw new Error('A multichain wallet is required');
        }
        const secret = await getAccountSecret(sdk, account.id);
        if (secret.type !== 'mnemonic') {
            throw new Error('Multichain swap requires a mnemonic account');
        }
        const sourceAddress = swapWalletAddress(args.sourceAsset.chainId, addresses);
        const result = await executeMultichainSwap({
            ...args,
            sourceAddress,
            destinationAddress: swapWalletAddress(args.destinationAsset.chainId, addresses),
            mnemonic: secret.mnemonic
        });

        // Every broadcast leg (approval + swap) lands on the source chain.
        reportPendingSwap(client, account, {
            ...args,
            routeId: args.prepared.routeId,
            providerRouteId: args.prepared.providerRouteId,
            sourceAddress,
            hashes: result.hashes
        });

        await client.invalidateQueries(anyOfKeysParts(QueryKey.multichainWalletAssets));
        schedulePostBroadcastRefresh(client);
        return result;
    });
};
