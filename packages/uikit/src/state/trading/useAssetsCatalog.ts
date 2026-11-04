import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';

import {
    getTradingAssets,
    TradingAssetsFilter,
    TradingAssetsOrder,
    TradingAssetsPage,
    TradingAssetsSort,
    TradingAssetsTab,
    TradingMarketAsset
} from '@tonkeeper/core/dist/service/tradingService';

import { useTranslation } from '../../hooks/translation';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { QueryKey } from '../../libs/queryKey';
import { useUserFiat } from '../fiat';

export type {
    TradingMarketAsset,
    TradingAssetsSort,
    TradingAssetsOrder,
    TradingAssetsTab,
    TradingAssetsFilter
};

const PAGE_SIZE = 50;

export interface UseAssetsCatalogArgs {
    tab?: TradingAssetsTab;
    chain?: string;
    search: string;
    sort: TradingAssetsSort;
    order?: TradingAssetsOrder;
    filter?: TradingAssetsFilter;
    /** Originating shelf key when navigating from a Trade-tab "see all". */
    sourceShelf?: string;
    /** Fired as each first-page request goes out, with the query it carries. */
    onSearchRequest?: (query: string | undefined) => void;
}

/**
 * Cursor-paginated trading catalog (`/api/v2/trading/assets`). Pages
 * accumulate under one cache entry; `items` is the flattened list and
 * `chains` the networks the current `tab` / `filter` have assets on.
 *
 * `X-Lang` is a custom header, so the browser preflights the request and the
 * trading backend must answer OPTIONS with `Access-Control-Allow-Headers:
 * X-Lang` — without that grant the request fails in the browser.
 */
export const useAssetsCatalog = ({
    tab,
    chain,
    search,
    sort,
    order,
    filter,
    sourceShelf,
    onSearchRequest
}: UseAssetsCatalogArgs) => {
    const fiat = useUserFiat();
    const {
        i18n: { language }
    } = useTranslation();
    const debouncedSearch = useDebouncedValue(search, 250);

    const query = useInfiniteQuery<TradingAssetsPage, Error>(
        [
            QueryKey.tradingAssetsCatalog,
            fiat,
            language,
            tab,
            chain,
            debouncedSearch,
            sort,
            order,
            filter,
            sourceShelf
        ],
        ({ pageParam }) => {
            if (pageParam === undefined) onSearchRequest?.(debouncedSearch || undefined);
            return getTradingAssets({
                currency: fiat,
                tab,
                query: debouncedSearch || undefined,
                chain,
                sort,
                order,
                filter,
                sourceShelf,
                cursor: pageParam as string | undefined,
                pageSize: PAGE_SIZE,
                lang: language
            });
        },
        {
            getNextPageParam: last => last.nextCursor || undefined,
            keepPreviousData: true,
            refetchOnWindowFocus: false,
            retry: false
        }
    );

    const items = useMemo(() => query.data?.pages.flatMap(page => page.items), [query.data?.pages]);
    const chains = query.data?.pages[0]?.chains;

    return { ...query, items, chains };
};
