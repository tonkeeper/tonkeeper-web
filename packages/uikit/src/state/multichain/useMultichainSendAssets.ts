import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';

import {
    getMultichainWalletAssets,
    isForeignAccountAsset,
    isVerifiedMultichainAsset,
    multichainOwnedAccountTypes,
    MultichainWalletAsset,
    MultichainWalletAssetsResponse
} from '@tonkeeper/core/dist/service/multichainWalletService';
import { multichainApiWalletCredentials } from '@tonkeeper/core/dist/service/chainkit/walletAuthService';

import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { QueryKey } from '../../libs/queryKey';
import { useActiveAccount } from '../wallet';
import { useUserFiat } from '../fiat';
import { isAssetVisible, usePendingAssetVisibility } from './useMultichainAssetVisibility';
import { useDustFilters } from './useDustFilters';
import { useSafeModeState } from './useSafeMode';

/** Android pages the send picker 25 at a time. */
const PAGE_SIZE = 25;

export interface UseMultichainSendAssetsArgs {
    /** `undefined` = every chain. */
    chain?: string;
    search: string;
}

/**
 * Cursor-paginated list of the assets the wallet can send from, for the send
 * flow's asset picker. Mirrors Android's picker: `available_only` holdings,
 * with chain and search applied by the backend.
 *
 * Search has to be the backend's: it matches the tickers users type against
 * symbols that a plain substring check misses (`usdt` finds `USD₮`).
 *
 * `assets` is `[]` for an account the multichain backend does not serve, and
 * `undefined` only while the first page of a served account is loading.
 */
export const useMultichainSendAssets = ({ chain, search }: UseMultichainSendAssetsArgs) => {
    const account = useActiveAccount();
    const fiat = useUserFiat();
    const debouncedSearch = useDebouncedValue(search.trim(), 200);
    const pendingVisibility = usePendingAssetVisibility();
    const { data: safeMode } = useSafeModeState();
    const safeModeEnabled = safeMode?.enabled;
    const { data: dustFilters } = useDustFilters();
    const hideDust = dustFilters?.hideDustBalances;

    const credentials = multichainApiWalletCredentials(account);
    const walletId = credentials?.walletId;
    const tonWalletId = account.type === 'multichain' ? account.activeTonWallet.id : undefined;

    const query = useInfiniteQuery<MultichainWalletAssetsResponse, Error>(
        [
            QueryKey.multichainWalletAssets,
            'send',
            walletId,
            tonWalletId,
            fiat,
            chain,
            debouncedSearch,
            safeModeEnabled,
            hideDust
        ],
        ({ pageParam }) =>
            getMultichainWalletAssets({
                walletId: walletId!,
                walletAuthKey: credentials?.walletAuthKey,
                currency: fiat,
                chain,
                search: debouncedSearch || undefined,
                availableOnly: true,
                verifiedOnly: safeModeEnabled || undefined,
                hideDust: hideDust || undefined,
                limit: PAGE_SIZE,
                cursor: pageParam as string | undefined
            }),
        {
            enabled:
                walletId !== undefined && safeModeEnabled !== undefined && hideDust !== undefined,
            getNextPageParam: last => last.nextCursor || undefined,
            keepPreviousData: true,
            refetchOnWindowFocus: false,
            retry: false
        }
    );

    // Rows of a TON version the account doesn't hold share the wallet id and
    // are dropped the way the home screen drops them, and so is any row with
    // nothing to send. A page boundary on the value-sorted list can repeat an asset; the first
    // copy wins. Visibility edits not yet acknowledged and safe mode apply on
    // top of the backend's own filters, as on the home screen.
    const assets = useMemo<MultichainWalletAsset[] | undefined>(() => {
        if (walletId === undefined || account.type !== 'multichain') return [];
        const pages = query.data?.pages;
        if (!pages) return undefined;
        const ownedAccountTypes = multichainOwnedAccountTypes(account);
        const seen = new Set<string>();
        const unique: MultichainWalletAsset[] = [];
        for (const asset of pages.flatMap(page => page.assets)) {
            if (isForeignAccountAsset(asset, ownedAccountTypes)) continue;
            if (new BigNumber(asset.balance).isZero()) continue;
            if (!isAssetVisible(asset, pendingVisibility)) continue;
            if (safeModeEnabled && !isVerifiedMultichainAsset(asset.verification)) continue;
            if (seen.has(asset.assetId)) continue;
            seen.add(asset.assetId);
            unique.push(asset);
        }
        return unique;
    }, [query.data?.pages, walletId, account, pendingVisibility, safeModeEnabled]);

    return { ...query, assets };
};
