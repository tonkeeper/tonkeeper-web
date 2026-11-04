import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchOnrampConfiguration } from '@tonkeeper/core/dist/onrampApi';
import type { OnrampConfiguration } from '@tonkeeper/core/dist/onrampApi';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { QueryKey } from '../../libs/queryKey';
import { useActiveConfig } from '../wallet';
import { useOnrampClientContext } from './useOnrampClientContext';

const PAGE_SIZE = 30;

export interface UseOnrampCatalogParams {
    /** Free-text query; the backend matches it against `symbol`. */
    search: string;
    /** First asset-id segment (`eth`, `bsc`, …); `undefined` = every chain. */
    chain?: string;
    fiat?: string;
}

/**
 * Cursor-paginated list of purchasable assets. Search and the chain filter
 * run on the backend: the catalog is paged, so filtering the loaded pages
 * locally would miss everything past them.
 */
export const useOnrampCatalog = ({ search, chain, fiat }: UseOnrampCatalogParams) => {
    const config = useActiveConfig();
    const ctx = useOnrampClientContext();
    const baseUrl = config.web_swaps_url ?? '';
    const q = useDebouncedValue(search.trim(), 300) || undefined;
    const destinationChain = chain ? `${chain}/mainnet` : undefined;

    const query = useInfiniteQuery<OnrampConfiguration, Error>(
        [
            QueryKey.onrampConfiguration,
            baseUrl,
            ctx.deviceCountryCode,
            ctx.timezone,
            ctx.platform,
            ctx.build,
            ctx.lang,
            ctx.walletId,
            fiat,
            destinationChain,
            q
        ],
        ({ pageParam }) =>
            fetchOnrampConfiguration(baseUrl, {
                q,
                destinationChain,
                fiat,
                cursor: pageParam as string | undefined,
                limit: PAGE_SIZE,
                xWalletID: ctx.walletId,
                deviceCountryCode: ctx.deviceCountryCode,
                timezone: ctx.timezone,
                platform: ctx.platform,
                build: ctx.build,
                lang: ctx.lang
            }),
        {
            enabled: !!baseUrl,
            getNextPageParam: last => last.nextCursor || undefined,
            keepPreviousData: true,
            refetchOnWindowFocus: false,
            retry: false,
            staleTime: 5 * 60 * 1000
        }
    );

    // Cursor pages can overlap when the catalog shifts between requests.
    const assets = useMemo(() => {
        if (!query.data) return undefined;
        const seen = new Set<string>();
        return query.data.pages
            .flatMap(page => page.assets)
            .filter(asset => !seen.has(asset.assetId) && seen.add(asset.assetId));
    }, [query.data]);

    return { ...query, assets };
};
