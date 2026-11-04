import { FC, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

import {
    catalogChains,
    filterCategoriesByChain,
    searchBrowserApps
} from '@tonkeeper/core/dist/service/browserCatalogService';

import { cn } from '../../../../libs/css';
import {
    useTrackDappBrowserOpen,
    useTrackDappBrowserSearch,
    useTrackDappBrowserTabClick
} from '../../../../hooks/analytics/dapp-browser';
import { useNavigate } from '../../../../hooks/router/useNavigate';
import { useTranslation } from '../../../../hooks/translation';
import { MULTICHAIN_BROWSER_CHAIN_PARAM, MultichainRoute } from '../../../../libs/routes';
import { SkeletonScope } from '../../../../primitives';
import { ModalCenterError } from '../../../../components/shared/ModalCenterState';
import IcExclamationmarkCircle28 from '../../../../icons/components/IcExclamationmarkCircle28';
import IcPlus16 from '../../../../icons/components/IcPlus16';
import { useBrowserCatalog } from '../../../../state/multichain/useBrowserCatalog';
import { MultichainChainChips } from '../MultichainChainChips';
import {
    PLACEHOLDER_BROWSER_APPS,
    PLACEHOLDER_BROWSER_CATEGORIES
} from '../multichain-placeholders';
import { MultichainMobileTabBar } from '../MultichainMobileTabBar';
import { BrowserAppsGrid, BrowserCategorySection } from './BrowserCategorySection';
import { BrowserBannersCarousel } from './BrowserBannersCarousel';
import { BrowserCategoryModal } from './BrowserCategoryModal';
import { BrowserConnectedView, ConnectDappButton, useCanConnectDapp } from './BrowserConnectedView';
import { BrowserSearchBar, BrowserSearchButton } from './BrowserSearchBar';
import { BrowserSearchModal } from './BrowserSearchModal';
import { BrowserSearchResults } from './BrowserSearchResults';
import { useOpenBrowserApp, useOpenBrowserDapp } from './browser-utils';

const CONNECTED_TAB_PARAM = 'tab';
const CONNECTED_TAB_VALUE = 'connected';

/**
 * Browser tab of the multichain shell (Figma "Browser/Explore" and
 * "Browser/Connected"): Explore / Connected pill switch on top, the dApps
 * catalog (banners carousel, services row, chain filter, category sections)
 * or the connected-apps grid below, and the search docked at the bottom —
 * a field that narrows the catalog as it is typed in on mobile, a compact
 * button that opens the search sheet on desktop. The page owns the column
 * geometry and the mobile bottom bar, mirroring `MultichainTradePage`.
 */
export const MultichainBrowserPage: FC<{ compact?: boolean }> = ({ compact = false }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { search } = useLocation();
    const openApp = useOpenBrowserApp();
    const openDapp = useOpenBrowserDapp();

    const connectedTab =
        new URLSearchParams(search).get(CONNECTED_TAB_PARAM) === CONNECTED_TAB_VALUE;
    const [chain, setChain] = useState<string | undefined>(
        () => new URLSearchParams(search).get(MULTICHAIN_BROWSER_CHAIN_PARAM) ?? undefined
    );
    /** Mobile only: the docked field narrows the catalog as it is typed in. */
    const [query, setQuery] = useState('');
    /** Desktop only: the search sheet its compact button opens. */
    const [searchOpen, setSearchOpen] = useState(false);
    const [categoryModal, setCategoryModal] = useState<string | undefined>(undefined);

    useTrackDappBrowserOpen(connectedTab ? 'connected' : 'explore');
    const trackTabClick = useTrackDappBrowserTabClick();
    const { trackSearchOpen, trackSearchResultOpen } = useTrackDappBrowserSearch();

    const { data: catalog, isError, refetch } = useBrowserCatalog();
    const canConnectDapp = useCanConnectDapp();

    const chains = useMemo(() => (catalog !== undefined ? catalogChains(catalog) : []), [catalog]);
    const categories =
        catalog !== undefined ? filterCategoriesByChain(catalog.categories, chain) : [];
    const searching = query.trim() !== '';
    // The Connected tab is about pairing, not browsing, so its docked search
    // gives way to a Connect dApp button. A query typed on Explore keeps the
    // field, or it could never be cleared.
    const docksConnectButton = connectedTab && canConnectDapp && !searching;

    const selectTab = (connected: boolean) => {
        trackTabClick(connected ? 'connected' : 'explore');
        navigate(
            `${MultichainRoute.browser}${
                connected ? `?${CONNECTED_TAB_PARAM}=${CONNECTED_TAB_VALUE}` : ''
            }`,
            { replace: true }
        );
    };

    const onSeeAll = (categoryId: string) => {
        // Desktop opens the category over the catalog; mobile navigates to it.
        if (compact) {
            setCategoryModal(categoryId);
            return;
        }
        const params = new URLSearchParams();
        if (chain !== undefined) {
            params.set('chain', chain);
        }
        const queryString = params.toString();
        navigate(
            `${MultichainRoute.browserCategory}/${categoryId}${
                queryString ? `?${queryString}` : ''
            }`
        );
    };

    const tabs = (
        <div className="flex py-2">
            {[
                { connected: false, label: t('browser_explore_tab') },
                { connected: true, label: t('browser_connected_tab') }
            ].map(tab => (
                <button
                    key={tab.label}
                    type="button"
                    onClick={() => selectTab(tab.connected)}
                    className={cn(
                        'cursor-pointer rounded-2xl px-3 py-1.5 text-label2 text-buttonSecondaryForeground transition-colors duration-100',
                        tab.connected === connectedTab
                            ? 'bg-buttonSecondaryBackground hover:bg-buttonSecondaryBackgroundHighlighted'
                            : 'hover:bg-backgroundHighlighted'
                    )}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );

    const onSearchUrl = (url: string) => {
        trackSearchOpen(url);
        openDapp(url, 'browser_search');
    };

    const searchBar = (
        <BrowserSearchBar value={query} onChange={setQuery} onOpenUrl={onSearchUrl} />
    );

    // The Connected tab reads its own stores, so it doesn't wait on the
    // catalog — unless the docked search is narrowing the loaded catalog.
    let content;
    if (connectedTab && !(searching && catalog !== undefined)) {
        content = <BrowserConnectedView compact={compact} />;
    } else if (catalog === undefined && isError) {
        // Retries are spent once the query reports an error, so the skeleton
        // would otherwise stay up for good.
        content = (
            <div className="pt-16">
                <ModalCenterError icon={<IcExclamationmarkCircle28 />} onRetry={() => refetch()} />
            </div>
        );
    } else if (catalog === undefined) {
        content = (
            <SkeletonScope loading>
                <div className="aspect-[2/1] w-full shrink-0 rounded-2xl bg-backgroundContent" />
                <BrowserAppsGrid
                    apps={PLACEHOLDER_BROWSER_APPS.slice(0, 4)}
                    onOpenApp={() => undefined}
                    compact={compact}
                />
                <MultichainChainChips value={undefined} onChange={() => undefined} />
                {PLACEHOLDER_BROWSER_CATEGORIES.map(category => (
                    <BrowserCategorySection
                        key={category.id}
                        category={category}
                        onSeeAll={() => undefined}
                        onOpenApp={() => undefined}
                        compact={compact}
                    />
                ))}
            </SkeletonScope>
        );
    } else if (searching) {
        content = (
            <BrowserSearchResults
                query={query}
                matches={searchBrowserApps(catalog, query)}
                onOpenApp={app => {
                    trackSearchResultOpen(app.url);
                    openApp(app, { from: 'browser_search' });
                }}
                onOpenUrl={onSearchUrl}
            />
        );
    } else {
        content = (
            <>
                <BrowserBannersCarousel
                    banners={catalog.banners}
                    onOpenApp={app => openApp(app, { utmSource: 'featured' })}
                />
                {catalog.servicesRow.length > 0 && (
                    <BrowserAppsGrid
                        apps={catalog.servicesRow}
                        onOpenApp={index => openApp(catalog.servicesRow[index])}
                        compact={compact}
                    />
                )}
                {chains.length > 0 && (
                    <MultichainChainChips value={chain} onChange={setChain} chains={chains} />
                )}
                {categories.map(category => (
                    <BrowserCategorySection
                        key={category.id}
                        category={category}
                        onSeeAll={() => onSeeAll(category.id)}
                        onOpenApp={app => openApp(app)}
                        compact={compact}
                    />
                ))}
            </>
        );
    }

    const catalogColumn = (
        <div className="mx-auto flex w-full max-w-[520px] flex-1 flex-col gap-2 px-4 pb-4 text-textPrimary">
            {tabs}
            {content}
        </div>
    );

    const categorySheet = categoryModal !== undefined && (
        <BrowserCategoryModal
            categoryId={categoryModal}
            initialChain={chain}
            onClose={() => setCategoryModal(undefined)}
        />
    );

    if (compact) {
        return (
            // Filling the scroll column keeps the search docked at its bottom
            // even when the catalog is too short to scroll.
            <div className="flex min-h-full flex-col">
                {catalogColumn}
                {/* The search button floats over the catalog on a fade to the
                    page background, 16px above the section nav. The scroll
                    column reserves the nav's 36px overlap below its content —
                    which a sticky box cannot be pushed into — so the fade
                    carries on opaque across it instead, and no content
                    reappears between the two bars. */}
                <div className="pointer-events-none sticky bottom-0 z-10 mt-auto bg-gradient-to-t from-backgroundPage to-transparent pb-4 pt-12">
                    <div className="pointer-events-auto flex justify-center">
                        {docksConnectButton ? (
                            <ConnectDappButton
                                variant="tertiary"
                                size="small"
                                leftIcon={<IcPlus16 />}
                            />
                        ) : (
                            <BrowserSearchButton onClick={() => setSearchOpen(true)} />
                        )}
                    </div>
                    <div className="absolute inset-x-0 top-full h-9 bg-backgroundPage" />
                </div>
                {searchOpen && <BrowserSearchModal onClose={() => setSearchOpen(false)} />}
                {categorySheet}
            </div>
        );
    }

    return (
        <>
            {catalogColumn}
            <div className="h-36" aria-hidden />
            <MultichainMobileTabBar
                topContent={
                    docksConnectButton ? (
                        <ConnectDappButton
                            variant="secondary"
                            size="medium"
                            fullWidth
                            leftIcon={<IcPlus16 />}
                        />
                    ) : (
                        searchBar
                    )
                }
            />
            {categorySheet}
        </>
    );
};
