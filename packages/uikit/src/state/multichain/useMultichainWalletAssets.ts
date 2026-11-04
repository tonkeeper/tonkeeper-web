import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';

import {
    getOwnMultichainWalletAssets,
    isVerifiedMultichainAsset,
    multichainOwnedAccountTypes,
    MultichainOwnedAccountTypes,
    MultichainWalletAsset,
    parseBackendTotalFiat,
    sumAssetsFiat
} from '@tonkeeper/core/dist/service/multichainWalletService';
import {
    MultichainApiWalletCredentials,
    multichainApiWalletCredentials
} from '@tonkeeper/core/dist/service/chainkit/walletAuthService';
import { ensureMultichainWalletRegistered } from '@tonkeeper/core/dist/service/chainkit/multichainApiAuth';
import { IStorage } from '@tonkeeper/core/dist/Storage';

import { useAppSdk } from '../../hooks/appSdk';
import { QueryKey } from '../../libs/queryKey';
import { useActiveAccount } from '../wallet';
import { useUserFiat } from '../fiat';
import { DefaultRefetchInterval } from '../tonendpoint';
import {
    AssetVisibilityMap,
    isAssetVisible,
    usePendingAssetVisibility
} from './useMultichainAssetVisibility';
import { useDustFilters } from './useDustFilters';
import { useSafeModeState } from './useSafeMode';

export interface MultichainWalletAssetsData {
    assets: MultichainWalletAsset[];
    totalFiat: BigNumber;
}

export { parseBackendTotalFiat };

/**
 * Cache entry of one wallet's portfolio. Shared by the home screen and the
 * switcher's per-account totals, so the same wallet never shows two
 * different numbers and one refetch (interval, focus, a send's
 * invalidation) refreshes both.
 */
export const multichainWalletAssetsQueryKey = (
    walletId: string | undefined,
    tonWalletId: string | undefined,
    fiat: string,
    safeModeEnabled: boolean | undefined,
    hideDust: boolean | undefined
) => [QueryKey.multichainWalletAssets, walletId, tonWalletId, fiat, safeModeEnabled, hideDust];

export async function fetchMultichainWalletAssets(
    storage: IStorage,
    credentials: MultichainApiWalletCredentials,
    ownedAccountTypes: MultichainOwnedAccountTypes,
    fiat: string,
    verifiedOnly: boolean,
    hideDust: boolean
): Promise<MultichainWalletAssetsData> {
    // A registration that didn't land at creation (offline, backend
    // hiccup) is retried here — reads only answer for wallets bound to
    // the device. A retry failure is not fatal to the fetch attempt.
    await ensureMultichainWalletRegistered(storage, credentials).catch(() => undefined);

    return getOwnMultichainWalletAssets({
        walletId: credentials.walletId,
        walletAuthKey: credentials.walletAuthKey,
        ownedAccountTypes,
        currency: fiat,
        verifiedOnly,
        hideDust
    });
}

/**
 * Multichain wallet-assets query. Fetches the flat list of assets the
 * backend has indexed for this multichain wallet — TON + EVM + BTC +
 * TRON — and the backend-computed portfolio total from the response's
 * `fiat_price`, mirroring iOS / Android.
 *
 * Visibility is entirely the backend's call: without `show_hidden` the
 * response already excludes hidden assets, which by default means every
 * asset the wallet holds no balance in. Neither native app filters the
 * list further, and re-deriving the rule here would drop the zero-balance
 * assets a user has deliberately switched back on in Manage Crypto.
 *
 * Gated on `account.type === 'multichain'` and the account carrying a
 * format-2 `multichainWalletId`, so a legacy account active in the same
 * profile — or a multichain account whose id predates format 2 — never
 * hits the multichain backend.
 */
export const useMultichainWalletAssets = () => {
    const sdk = useAppSdk();
    const account = useActiveAccount();
    const fiat = useUserFiat();
    const pendingVisibility = usePendingAssetVisibility();
    const { data: safeMode } = useSafeModeState();
    const safeModeEnabled = safeMode?.enabled;
    const { data: dustFilters } = useDustFilters();
    const hideDust = dustFilters?.hideDustBalances;

    const credentials = multichainApiWalletCredentials(account);
    const walletId = credentials?.walletId;
    const tonWalletId = account.type === 'multichain' ? account.activeTonWallet.id : undefined;

    const query = useQuery<MultichainWalletAssetsData, Error>(
        multichainWalletAssetsQueryKey(walletId, tonWalletId, fiat, safeModeEnabled, hideDust),
        async () => {
            if (!credentials || account.type !== 'multichain') {
                return { assets: [], totalFiat: new BigNumber(0) };
            }
            return fetchMultichainWalletAssets(
                sdk.storage,
                credentials,
                multichainOwnedAccountTypes(account),
                fiat,
                safeModeEnabled === true,
                hideDust === true
            );
        },
        {
            enabled:
                walletId !== undefined && safeModeEnabled !== undefined && hideDust !== undefined,
            refetchInterval: DefaultRefetchInterval,
            refetchIntervalInBackground: true,
            refetchOnWindowFocus: true,
            keepPreviousData: true,
            retry: false
        }
    );

    const filtered = useMemo<MultichainWalletAssetsData | undefined>(
        () => query.data && applyLocalAssetFilters(query.data, pendingVisibility, safeModeEnabled),
        [query.data, pendingVisibility, safeModeEnabled]
    );

    return { ...query, data: filtered };
};

/**
 * Overlays the not-yet-acknowledged visibility choices on a backend
 * response. Done outside the query function so toggling visibility updates
 * the portfolio instantly — no waiting for the POST and the refetch behind
 * it. An asset switched back on can't be added here, since the response the
 * backend already filtered doesn't carry it; it arrives with the refetch.
 * The hidden assets' fiat value is subtracted from the backend total rather
 * than re-summing the remaining rows, so the total stays anchored to the
 * backend's number.
 *
 * Safe mode piggybacks on the same overlay as a client-side safety net:
 * `verified_only` already asks the backend to drop unverified assets, but
 * until the flag is live on every deployment (Android keeps the same
 * fallback) a row that slips through is filtered — and subtracted from the
 * total — here.
 */
export const applyLocalAssetFilters = (
    data: MultichainWalletAssetsData,
    pendingVisibility: AssetVisibilityMap,
    safeModeEnabled: boolean | undefined
): MultichainWalletAssetsData => {
    const isShown = (a: MultichainWalletAsset) =>
        isAssetVisible(a, pendingVisibility) &&
        (!safeModeEnabled || isVerifiedMultichainAsset(a.verification));
    const hiddenAssets = data.assets.filter(a => !isShown(a));
    if (hiddenAssets.length === 0) return data;
    const assets = data.assets.filter(isShown);
    const totalFiat = BigNumber.max(data.totalFiat.minus(sumAssetsFiat(hiddenAssets)), 0);
    return { assets, totalFiat };
};
