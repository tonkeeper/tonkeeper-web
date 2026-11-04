import { useInfiniteQuery } from '@tanstack/react-query';
import { Address } from '@ton/core';

import {
    getMultichainWalletActivities,
    MultichainActivity,
    MultichainActivityType,
    MultichainChain
} from '@tonkeeper/core/dist/service/multichainActivityService';

import { multichainApiWalletCredentials } from '@tonkeeper/core/dist/service/chainkit/walletAuthService';
import { APIConfig } from '@tonkeeper/core/dist/entries/apis';
import {
    ScaledUIMultiplier,
    toScaledUIWeiAmount
} from '@tonkeeper/core/dist/entries/crypto/asset/scaled-ui';
import { JettonsApi } from '@tonkeeper/core/dist/tonApiV2';
import { QueryKey } from '../../libs/queryKey';
import { parseAssetIdHead } from '../../pages/home/multichain/multichain-utils';
import { useActiveAccount, useActiveApi } from '../wallet';
import { useDustFilters } from './useDustFilters';

const PAGE_SIZE = 30;

export interface MultichainActivityFilters {
    chain?: MultichainChain;
    activityType?: MultichainActivityType;
    /**
     * `true` = the Spam tab: only backend-classified spam. Every other feed
     * excludes spam, so a real activity and its spam look-alike never share
     * a page (matches both native apps).
     */
    spam?: boolean;
    /** Single-asset feed (the asset page's history). Overrides `chain`. */
    assetId?: string;
}

const PENDING_REFETCH_INTERVAL_MS = 15_000;

/** Raw TON jetton address → its scaled-UI multiplier, `null` for an unscaled jetton. */
const scaledUiCache = new Map<string, ScaledUIMultiplier | null>();

const tonJettonRawAddress = (assetId: string | undefined): string | undefined => {
    if (!assetId) return undefined;
    const { network, type } = parseAssetIdHead(assetId);
    if (network !== 'ton' || type !== 'jetton') return undefined;
    try {
        return Address.parse(assetId.split('/')[3]).toRawString();
    } catch {
        return undefined;
    }
};

const loadScaledUiMultipliers = async (api: APIConfig, addresses: string[]) => {
    const missing = addresses.filter(address => !scaledUiCache.has(address));
    if (missing.length === 0) return;
    const { jettons } = await new JettonsApi(api.tonApiV2).getJettonInfosByAddresses({
        getAccountsRequest: { accountIds: missing }
    });
    const found = new Map(
        jettons.map(j => [Address.parse(j.metadata.address).toRawString(), j.scaledUi])
    );
    missing.forEach(address => scaledUiCache.set(address, found.get(address) ?? null));
};

/**
 * The backend reports TON jetton amounts in on-chain units, while a scaled-UI
 * jetton (tokenized stocks) is displayed multiplied by its master's ratio,
 * which only TonAPI knows. A failed lookup leaves the amounts as the backend
 * sent them rather than failing the feed.
 */
const applyTonJettonScaledUi = async (
    api: APIConfig,
    activities: MultichainActivity[]
): Promise<MultichainActivity[]> => {
    const addresses = new Set<string>();
    activities.forEach(a =>
        [a.outToken, a.inToken, a.feeToken].forEach(token => {
            const address = tonJettonRawAddress(token?.assetId);
            if (address) addresses.add(address);
        })
    );
    if (addresses.size === 0) return activities;
    try {
        await loadScaledUiMultipliers(api, [...addresses]);
    } catch {
        return activities;
    }

    const scale = (
        token: MultichainActivity['outToken'],
        amount: string | undefined
    ): string | undefined => {
        const address = tonJettonRawAddress(token?.assetId);
        const multiplier = address ? scaledUiCache.get(address) : undefined;
        return amount && multiplier ? toScaledUIWeiAmount(amount, multiplier) : amount;
    };
    return activities.map(a => ({
        ...a,
        outAmount: scale(a.outToken, a.outAmount),
        inAmount: scale(a.inToken, a.inAmount),
        feeAmount: scale(a.feeToken, a.feeAmount)
    }));
};

/**
 * Cross-chain activity feed for a multichain wallet, paged with the
 * backend's cursor. Chain, type, and asset filters are server-enforced
 * (passed straight through as query params), so changing any of them
 * produces a fresh query key and a clean first page.
 *
 * The wallet's primary TON address is threaded through so activities of
 * other TON wallet versions registered under the same seed-derived
 * backend `wallet_id` (by another client) don't contaminate the feed.
 *
 * While the loaded feed contains a `pending` activity (a just-broadcast
 * transaction reported via `registerPendingActivity`, or an unsettled
 * cross-chain swap), the query polls so the row flips to confirmed
 * without a manual refresh.
 *
 * Gated on `account.type === 'multichain'` and a present
 * `multichainWalletId`, so a legacy account active in the same profile
 * never hits the multichain backend.
 */
export const useMultichainActivity = (filters: MultichainActivityFilters = {}) => {
    const account = useActiveAccount();
    const api = useActiveApi();
    const credentials = multichainApiWalletCredentials(account);
    const walletId = credentials?.walletId;
    const primaryTonAddress =
        account.type === 'multichain' ? account.activeTonWallet.rawAddress : undefined;
    const { data: dustFilters } = useDustFilters();
    const spam = filters.spam === true;
    // The asset page's feed is that asset's complete history, and the Spam
    // tab is all-or-nothing by definition — the dust filter applies to the
    // main feed only, matching iOS.
    const hideDust =
        filters.assetId === undefined && !spam ? dustFilters?.hideDustActivities : false;

    return useInfiniteQuery<{ activities: MultichainActivity[]; nextCursor: string }, Error>({
        queryKey: [
            QueryKey.multichainActivity,
            walletId,
            primaryTonAddress,
            filters.chain ?? 'all',
            filters.activityType ?? 'all',
            spam,
            filters.assetId ?? 'all',
            hideDust
        ],
        queryFn: async ({ pageParam }) => {
            if (!walletId) return { activities: [], nextCursor: '' };
            const page = await getMultichainWalletActivities({
                walletId,
                walletAuthKey: credentials?.walletAuthKey,
                chain: filters.chain,
                activityType: filters.activityType,
                isSpam: spam,
                assetId: filters.assetId,
                primaryTonAddress,
                hideDust,
                cursor: pageParam as string | undefined,
                limit: PAGE_SIZE
            });
            return {
                ...page,
                activities: await applyTonJettonScaledUi(api, page.activities)
            };
        },
        getNextPageParam: lastPage => (lastPage.nextCursor ? lastPage.nextCursor : undefined),
        enabled: walletId !== undefined && hideDust !== undefined,
        keepPreviousData: true,
        retry: false,
        refetchInterval: data =>
            data?.pages.some(page => page.activities.some(a => a.status === 'pending'))
                ? PENDING_REFETCH_INTERVAL_MS
                : false
    });
};
