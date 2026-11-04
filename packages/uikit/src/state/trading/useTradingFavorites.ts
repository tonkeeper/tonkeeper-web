import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AppKey } from '@tonkeeper/core/dist/Keys';
import {
    getTradingAssetsByIds,
    TradingMarketAsset
} from '@tonkeeper/core/dist/service/tradingService';

import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { QueryKey } from '../../libs/queryKey';
import { useUserFiat } from '../fiat';
import { useActiveAccount } from '../wallet';

/**
 * Display fields captured when an asset is favorited, so the Trade tab's
 * favorites rail renders instantly from storage; live price / 24h change
 * hydrate from the trading API on top (`useTradingFavoritesMarketData`).
 */
export interface TradingFavoriteStub {
    assetId: string;
    symbol: string;
    name: string;
    imageUrl: string;
    addedAt: number;
}

type FavoritesMap = Record<string, TradingFavoriteStub[]>;

function useMultichainWalletId(): string | undefined {
    const account = useActiveAccount();
    return account.type === 'multichain' ? account.multichainWalletId : undefined;
}

/** Ordered favorites of the active multichain wallet (array order = display order). */
export const useTradingFavorites = (): TradingFavoriteStub[] => {
    const sdk = useAppSdk();
    const walletId = useMultichainWalletId();

    const { data } = useQuery<TradingFavoriteStub[]>(
        [AppKey.MULTICHAIN_FAVORITE_ASSETS, walletId],
        async () => {
            if (!walletId) return [];
            const raw = await sdk.storage.get<FavoritesMap>(AppKey.MULTICHAIN_FAVORITE_ASSETS);
            return raw?.[walletId] ?? [];
        },
        { enabled: walletId !== undefined, keepPreviousData: true }
    );

    return data ?? [];
};

/** Persists the full ordered favorites list of the active wallet. */
export const useMutateTradingFavorites = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    const walletId = useMultichainWalletId();

    return useMutation<void, Error, TradingFavoriteStub[]>(async favorites => {
        if (!walletId) throw new Error('Not a multichain account');
        const raw = (await sdk.storage.get<FavoritesMap>(AppKey.MULTICHAIN_FAVORITE_ASSETS)) ?? {};
        raw[walletId] = favorites;
        await sdk.storage.set(AppKey.MULTICHAIN_FAVORITE_ASSETS, raw);
        await client.invalidateQueries([AppKey.MULTICHAIN_FAVORITE_ASSETS, walletId]);
    });
};

/**
 * Live market data for the favorited assets, batched through the trading
 * API's `ids` filter. Renders degrade gracefully: the rail shows storage
 * stubs immediately and overlays price / change when this resolves.
 */
export const useTradingFavoritesMarketData = (): {
    byId: Map<string, TradingMarketAsset>;
    /**
     * The first batch is still in flight — cards should reserve their
     * market-driven lines as loading bars instead of growing when the
     * data lands. `false` once anything (or an error) has arrived.
     */
    isLoading: boolean;
} => {
    const fiat = useUserFiat();
    const {
        i18n: { language }
    } = useTranslation();
    const favorites = useTradingFavorites();
    const ids = favorites.map(f => f.assetId);

    const { data, isError } = useQuery<TradingMarketAsset[]>(
        [QueryKey.tradingAssetsByIds, fiat, language, ids.join(',')],
        () => getTradingAssetsByIds({ ids, currency: fiat, lang: language }),
        {
            enabled: ids.length > 0,
            staleTime: 30_000,
            keepPreviousData: true,
            refetchOnWindowFocus: false,
            retry: false
        }
    );

    return {
        byId: new Map((data ?? []).map(asset => [asset.assetId, asset])),
        isLoading: ids.length > 0 && !data && !isError
    };
};

/** Convenience toggle used by the asset-page star button. */
export const useToggleTradingFavorite = () => {
    const favorites = useTradingFavorites();
    const { mutateAsync } = useMutateTradingFavorites();

    const isFavorite = (assetId: string) => favorites.some(f => f.assetId === assetId);

    const toggle = async (stub: Omit<TradingFavoriteStub, 'addedAt'>) => {
        if (isFavorite(stub.assetId)) {
            await mutateAsync(favorites.filter(f => f.assetId !== stub.assetId));
            return false;
        }
        await mutateAsync([...favorites, { ...stub, addedAt: Date.now() }]);
        return true;
    };

    return { isFavorite, toggle };
};
