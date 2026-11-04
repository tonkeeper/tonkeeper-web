import { FC, useEffect, useMemo, useRef, useState } from 'react';

import {
    CATALOG_SORTINGS,
    TradingAssetsFilter,
    TradingAssetsTab,
    TradingCatalogSorting
} from '@tonkeeper/core/dist/service/tradingService';
import { MULTICHAIN_CHAIN_DISPLAY_ORDER } from '@tonkeeper/core/dist/chains/multichain-chain-order';

import { Loader, SearchField, SkeletonScope } from '../../../../primitives';
import IcExclamationmarkCircle28 from '../../../../icons/components/IcExclamationmarkCircle28';
import IcMagnifyingGlass28 from '../../../../icons/components/IcMagnifyingGlass28';
import { InlineRetryRow } from '../../../../components/shared/InlineRetryRow';
import { ModalCenterError, ModalCenterState } from '../../../../components/shared/ModalCenterState';
import { AssetViewSource } from '../../../../hooks/analytics/asset-view';
import { TradeSource, useTradeAnalytics } from '../../../../hooks/analytics/trade';
import { useTranslation } from '../../../../hooks/translation';
import { useAssetsCatalog } from '../../../../state/trading/useAssetsCatalog';
import { MultichainChainChips } from '../MultichainChainChips';
import { PLACEHOLDER_CATALOG_ASSETS } from '../multichain-placeholders';
import { CryptoCatalogRow } from './CryptoCatalogRow';
import { CryptoCatalogSortButton } from './CryptoCatalogSortButton';

export interface CryptoCatalogViewProps {
    /** Fired before navigating to a tapped asset (modal host closes itself). */
    onSelectAsset?: () => void;
    initialChain?: string;
    initialSorting?: TradingCatalogSorting;
    tab?: TradingAssetsTab;
    filter?: TradingAssetsFilter;
    sourceShelf?: string;
    autoFocusSearch?: boolean;
    /** Reported as the `asset_view` entry point when a row is tapped. */
    assetViewSource?: AssetViewSource;
    /** Reported as the `from` of the catalog's `trade_search*` events. */
    tradeSource?: TradeSource;
}

/**
 * Catalog body shared by the home "Crypto" modal and the Trade tab's routed
 * Crypto page: search, chain chips, cursor-paginated asset list and the
 * floating sort pill. The host owns the surrounding chrome (header, modal
 * shell / page geometry).
 */
export const CryptoCatalogView: FC<CryptoCatalogViewProps> = ({
    onSelectAsset,
    initialChain,
    initialSorting = 'market_cap',
    tab,
    filter,
    sourceShelf,
    autoFocusSearch = false,
    assetViewSource = 'wallet_screen',
    tradeSource = 'wallet_screen'
}) => {
    const { t } = useTranslation();
    const tradeAnalytics = useTradeAnalytics();
    const [chain, setChain] = useState<string | undefined>(initialChain);
    const [search, setSearch] = useState('');
    const [sorting, setSorting] = useState<TradingCatalogSorting>(initialSorting);
    const { sort, order } = CATALOG_SORTINGS[sorting];

    const {
        items,
        chains,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
        isError,
        isPreviousData,
        refetch
    } = useAssetsCatalog({
        tab,
        chain,
        search,
        sort,
        order,
        filter,
        sourceShelf,
        onSearchRequest: query => tradeAnalytics.search(tradeSource, query)
    });

    // Rendering only — decisions (pagination, empty state) keep reading `items`.
    // Retries are disabled, so an error is final. With nothing loaded the
    // chips stay live (they don't depend on the failed request) and the list
    // area shows the retry state instead of staying masked; rows already on
    // screen stay put when a later page or a filter refresh fails — that
    // error lands in the list footer instead.
    const showError = items === undefined && isError;
    const isLoading = items === undefined && !isError;
    const viewItems = items ?? PLACEHOLDER_CATALOG_ASSETS;
    // Networks this build can't render are dropped rather than shown bare.
    const chipChains = useMemo(
        () =>
            chains?.filter(code =>
                (MULTICHAIN_CHAIN_DISPLAY_ORDER as readonly string[]).includes(code)
            ),
        [chains]
    );
    // A selection the server no longer lists would filter to an empty list
    // with no chip to undo it, so it falls back to "All".
    useEffect(() => {
        if (chipChains && chain && !chipChains.includes(chain)) setChain(undefined);
    }, [chipChains, chain]);
    const searchQuery = search.trim();
    // Rows shown under a new filter are the previous filter's until its own
    // first page lands, so a failure there is a first-page retry, not a
    // next-page one.
    const retryLoadMore = () => (isPreviousData || !hasNextPage ? refetch() : fetchNextPage());

    // A failed page must not re-arm the observer: the sentinel is still in
    // view, so it would refire the same request in a loop. The footer's
    // Retry is the only way forward after an error.
    const sentinelRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel || !hasNextPage || isError) return;
        const observer = new IntersectionObserver(entries => {
            if (entries.some(e => e.isIntersecting) && !isFetchingNextPage) {
                fetchNextPage();
            }
        });
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage, isError]);

    return (
        <SkeletonScope loading={isLoading}>
            <div className="px-4 pb-3">
                <SearchField
                    value={search}
                    onChange={setSearch}
                    autoFocus={autoFocusSearch}
                    placeholder={t('crypto_catalog_search_placeholder')}
                    className="!p-0"
                />
            </div>
            <div className="px-4 pb-3">
                <MultichainChainChips value={chain} onChange={setChain} chains={chipChains} />
            </div>
            {/* The rounded scroll viewport is pinned inside the card and the
                rows scroll within it, so its corners stay crisp while
                scrolling. The clearance that keeps the last row clear of the
                floating sort pill lives on the transparent viewport, not on
                the list surface, so a short result set doesn't carry an empty
                tail on its background. */}
            <div className="min-h-0 flex-1 px-4 pb-4">
                {showError ? (
                    <div className="pt-16">
                        <ModalCenterError
                            icon={<IcExclamationmarkCircle28 />}
                            onRetry={() => refetch()}
                        />
                    </div>
                ) : viewItems.length === 0 ? (
                    searchQuery ? (
                        <div className="pt-16">
                            <ModalCenterState
                                icon={<IcMagnifyingGlass28 />}
                                title={t('not_found_title')}
                                subtitle={t('search_no_results', { query: searchQuery })}
                            />
                        </div>
                    ) : (
                        <div className="px-4 py-6 text-center text-body2 text-textSecondary">
                            {t('add_funds_no_assets_found')}
                        </div>
                    )
                ) : (
                    <div className="hide-scrollbar max-h-full overflow-y-auto rounded-medium pb-24">
                        <div className="rounded-medium bg-backgroundContent [--tk-skeleton-fill:var(--tk-background-content-tint)]">
                            {viewItems.map((asset, idx) => (
                                <div
                                    key={asset.assetId}
                                    className={idx === 0 ? '' : 'border-t border-separatorCommon'}
                                >
                                    <CryptoCatalogRow
                                        asset={asset}
                                        onSelect={() => {
                                            tradeAnalytics.searchClick(
                                                tradeSource,
                                                searchQuery || undefined,
                                                asset.assetId
                                            );
                                            onSelectAsset?.();
                                        }}
                                        assetViewSource={assetViewSource}
                                    />
                                </div>
                            ))}
                            <div ref={sentinelRef} aria-hidden />
                            {isFetchingNextPage && (
                                <div className="flex justify-center py-4">
                                    <Loader size="small" />
                                </div>
                            )}
                            {isError && !isFetchingNextPage && (
                                <InlineRetryRow onRetry={retryLoadMore} />
                            )}
                        </div>
                    </div>
                )}
            </div>
            {!isLoading && !showError && (
                <CryptoCatalogSortButton value={sorting} onChange={setSorting} />
            )}
        </SkeletonScope>
    );
};
