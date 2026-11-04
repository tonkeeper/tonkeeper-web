import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AppKey } from '@tonkeeper/core/dist/Keys';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { IStorage } from '@tonkeeper/core/dist/Storage';
import { saveMultichainAssetsFilters } from '@tonkeeper/core/dist/service/multichainWalletService';
import { multichainApiWalletCredentials } from '@tonkeeper/core/dist/service/chainkit/walletAuthService';

import { useAppSdk } from '../../hooks/appSdk';
import { QueryKey } from '../../libs/queryKey';
import { useActiveAccount } from '../wallet';

/** assetId → whether the user wants the asset on the portfolio. */
export type AssetVisibilityMap = Record<string, boolean>;

/** Keyed per wallet so several multichain wallets don't trample each other. */
type StoredVisibility = Record<string, AssetVisibilityMap>;

export interface AssetVisibilityChange {
    assetId: string;
    visible: boolean;
}

/** Stable identity so consumers' memos don't re-run on every render. */
const EMPTY_VISIBILITY: AssetVisibilityMap = {};

/**
 * Visibility choices the user made that the backend hasn't confirmed yet.
 *
 * The backend owns the truth: every asset row carries `is_hidden`, and a
 * wallet starts out with everything it holds no balance in already hidden —
 * so a fresh wallet has most of its ~1000 indexed assets switched off. This
 * store therefore holds only the un-acked delta and drops each entry once
 * its POST lands, exactly like iOS' `VisibilityChangesController` and
 * Android's `hiddenOverrides`. A permanent local hidden-set instead shadows
 * the backend's defaults (everything reads as visible) and can never pick up
 * a change made on another device.
 */
export const pendingAssetVisibilityQuery = (storage: IStorage, account: Account) => {
    const walletId = account.type === 'multichain' ? account.multichainWalletId : undefined;
    return {
        queryKey: [AppKey.MULTICHAIN_ASSET_VISIBILITY, walletId],
        queryFn: async (): Promise<AssetVisibilityMap> => {
            if (!walletId) return {};
            const raw = await storage.get<StoredVisibility>(AppKey.MULTICHAIN_ASSET_VISIBILITY);
            return raw?.[walletId] ?? {};
        },
        enabled: walletId !== undefined,
        keepPreviousData: true
    };
};

export const usePendingAssetVisibility = (): AssetVisibilityMap => {
    const sdk = useAppSdk();
    const account = useActiveAccount();
    const { data } = useQuery(pendingAssetVisibilityQuery(sdk.storage, account));
    return data ?? EMPTY_VISIBILITY;
};

/**
 * Applies the pending overrides on top of a backend row's `is_hidden`.
 */
export function isAssetVisible(
    asset: { assetId: string; isHidden: boolean },
    pending: AssetVisibilityMap
): boolean {
    return pending[asset.assetId] ?? !asset.isHidden;
}

export const useSetAssetVisibility = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    const account = useActiveAccount();
    const credentials = multichainApiWalletCredentials(account);
    const walletId = credentials?.walletId;

    return useMutation<void, Error, AssetVisibilityChange[]>(async changes => {
        if (!walletId) throw new Error('Not a multichain account');
        if (changes.length === 0) return;

        const stored =
            (await sdk.storage.get<StoredVisibility>(AppKey.MULTICHAIN_ASSET_VISIBILITY)) ?? {};
        const pending: AssetVisibilityMap = { ...stored[walletId] };
        changes.forEach(change => {
            pending[change.assetId] = change.visible;
        });
        await sdk.storage.set(AppKey.MULTICHAIN_ASSET_VISIBILITY, {
            ...stored,
            [walletId]: pending
        });
        await client.invalidateQueries([AppKey.MULTICHAIN_ASSET_VISIBILITY, walletId]);

        // The whole pending set goes up, not just this call's changes, so a
        // send that failed while offline is retried by the next one.
        await saveMultichainAssetsFilters({
            walletId,
            walletAuthKey: credentials?.walletAuthKey,
            changes: Object.entries(pending).map(([assetId, visible]) => ({
                assetId,
                action: visible ? 'show' : 'hide'
            }))
        });

        // Server truth first, overrides second: dropping them before the
        // portfolio refetch lands would flash the old visibility.
        await client.refetchQueries([QueryKey.multichainWalletAssets, walletId]);
        const acked =
            (await sdk.storage.get<StoredVisibility>(AppKey.MULTICHAIN_ASSET_VISIBILITY)) ?? {};
        const remaining: AssetVisibilityMap = { ...acked[walletId] };
        Object.entries(pending).forEach(([assetId, visible]) => {
            if (remaining[assetId] === visible) delete remaining[assetId];
        });
        await sdk.storage.set(AppKey.MULTICHAIN_ASSET_VISIBILITY, {
            ...acked,
            [walletId]: remaining
        });
        await client.invalidateQueries([AppKey.MULTICHAIN_ASSET_VISIBILITY, walletId]);
        await client.invalidateQueries([QueryKey.multichainWalletAssets, 'manage']);
    });
};
