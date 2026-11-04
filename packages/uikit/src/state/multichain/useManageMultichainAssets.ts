import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';

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
import { useDustFilters } from './useDustFilters';
import { useSafeModeState } from './useSafeMode';

/** iOS pages the same screen 30 at a time, Android 25. */
const PAGE_SIZE = 30;

export interface UseManageMultichainAssetsArgs {
    /** `undefined` = every chain. */
    chain?: string;
    search: string;
}

/**
 * Cursor-paginated asset list for the Manage Crypto screen: every asset the
 * backend tracks for this wallet, hidden ones included, in the backend's own
 * order (assets the wallet holds first, then the rest).
 *
 * Chain and search are backend filters, not client-side ones — a wallet's
 * list runs to a thousand-plus assets, so it can neither be fetched up front
 * nor filtered locally. Each filter combination is its own cache entry, which
 * is also what resets the list to page one when the user switches chains.
 */
export const useManageMultichainAssets = ({ chain, search }: UseManageMultichainAssetsArgs) => {
    const account = useActiveAccount();
    const fiat = useUserFiat();
    const debouncedSearch = useDebouncedValue(search.trim(), 300);
    const { data: safeMode } = useSafeModeState();
    const safeModeEnabled = safeMode?.enabled;
    const { data: dustFilters } = useDustFilters();
    const hideDust = dustFilters?.hideDustBalances;

    const credentials = multichainApiWalletCredentials(account);
    const walletId = credentials?.walletId;

    const query = useInfiniteQuery<MultichainWalletAssetsResponse, Error>(
        [
            QueryKey.multichainWalletAssets,
            'manage',
            walletId,
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
                showHidden: true,
                verifiedOnly: safeModeEnabled || undefined,
                hideDust: hideDust || undefined,
                limit: PAGE_SIZE,
                cursor: pageParam as string | undefined
            }),
        {
            enabled:
                walletId !== undefined && safeModeEnabled !== undefined && hideDust !== undefined,
            getNextPageParam: last => last.nextCursor || undefined,
            refetchOnWindowFocus: false,
            retry: false
        }
    );

    // The `verified_only` request param is the real filter; dropping
    // unverified rows here too keeps scam assets out of Manage Crypto on
    // deployments where the backend flag isn't live yet.
    //
    // Pages are cut from a value-sorted list whose order can shift between
    // requests, so an asset near a page boundary can arrive twice; the first
    // copy keeps its place and later ones are dropped.
    //
    // Rows of a TON version the account doesn't hold are listed under the
    // same wallet id too and are dropped the way the home screen drops them.
    const assets = useMemo<MultichainWalletAsset[] | undefined>(() => {
        const pages = query.data?.pages;
        if (!pages) return undefined;
        const ownedAccountTypes =
            account.type === 'multichain' ? multichainOwnedAccountTypes(account) : undefined;
        const seen = new Set<string>();
        const unique: MultichainWalletAsset[] = [];
        for (const asset of pages.flatMap(page => page.assets)) {
            if (ownedAccountTypes && isForeignAccountAsset(asset, ownedAccountTypes)) continue;
            if (seen.has(asset.assetId)) continue;
            seen.add(asset.assetId);
            unique.push(asset);
        }
        if (!safeModeEnabled) return unique;
        return unique.filter(a => isVerifiedMultichainAsset(a.verification));
    }, [query.data?.pages, safeModeEnabled, account]);

    return { ...query, assets };
};
