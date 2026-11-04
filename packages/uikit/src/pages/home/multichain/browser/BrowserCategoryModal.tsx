import { FC, useMemo, useState } from 'react';

import {
    catalogChains,
    filterCategoriesByChain,
    searchBrowserApps
} from '@tonkeeper/core/dist/service/browserCatalogService';

import { useTrackDappBrowserSearch } from '../../../../hooks/analytics/dapp-browser';
import { useTranslation } from '../../../../hooks/translation';
import { SkeletonScope } from '../../../../primitives';
import { useBrowserCatalog } from '../../../../state/multichain/useBrowserCatalog';
import { CloseButton } from '../../../../primitives/CloseButton';
import { MultichainChainChips } from '../MultichainChainChips';
import { Modal } from '../../../../primitives/Modal';
import { PLACEHOLDER_BROWSER_APPS } from '../multichain-placeholders';
import { BrowserAppListCard, BrowserAppListRow } from './BrowserAppListRow';
import { BrowserSearchBar } from './BrowserSearchBar';
import { BrowserSearchResults } from './BrowserSearchResults';
import { useOpenBrowserApp, useOpenBrowserDapp } from './browser-utils';

/**
 * A category's full app list, opened from the catalog's "See All" (Figma
 * "Browser/Lending/All"): the category title over the search field and the
 * chain filter, with the apps as a description list. The Explore tab stays
 * mounted behind the dimmed backdrop, so closing lands back on the same
 * scroll position and chain selection.
 *
 * Mobile keeps the routed `BrowserCategoryPage` — there the same content is a
 * screen of its own, entered through a back header with the search field
 * docked at the bottom.
 */
export const BrowserCategoryModal: FC<{
    categoryId: string;
    /** Seeds the chain filter from the catalog's own selection. */
    initialChain?: string;
    onClose: () => void;
}> = ({ categoryId, initialChain, onClose }) => {
    const { t } = useTranslation();
    const openApp = useOpenBrowserApp();
    const openDapp = useOpenBrowserDapp();
    const { trackSearchOpen, trackSearchResultOpen } = useTrackDappBrowserSearch();

    const [chain, setChain] = useState<string | undefined>(initialChain);
    const [query, setQuery] = useState('');

    const { data: catalog } = useBrowserCatalog();
    const category = catalog?.categories.find(c => c.id === categoryId);

    const chains = useMemo(() => {
        if (catalog === undefined) {
            return [];
        }
        return catalogChains(catalog);
    }, [catalog]);

    const apps =
        category !== undefined ? filterCategoriesByChain([category], chain)[0]?.apps ?? [] : [];
    const searching = query.trim() !== '';

    const onSearchUrl = (url: string) => {
        trackSearchOpen(url);
        openDapp(url, 'browser_search');
    };

    let content;
    if (category === undefined) {
        content = (
            <SkeletonScope loading>
                <BrowserAppListCard>
                    {PLACEHOLDER_BROWSER_APPS.map(app => (
                        <BrowserAppListRow key={app.id} app={app} onClick={() => undefined} />
                    ))}
                </BrowserAppListCard>
            </SkeletonScope>
        );
    } else if (searching) {
        content = (
            <BrowserSearchResults
                query={query}
                matches={searchBrowserApps(
                    { banners: [], servicesRow: [], categories: [category] },
                    query
                )}
                onOpenApp={app => {
                    trackSearchResultOpen(app.url);
                    openApp(app, { from: 'browser_search' });
                }}
                onOpenUrl={onSearchUrl}
            />
        );
    } else if (apps.length === 0) {
        content = (
            <div className="px-8 py-16 text-center text-body2 text-textSecondary">
                {t('browser_search_empty')}
            </div>
        );
    } else {
        content = (
            <BrowserAppListCard>
                {apps.map(app => (
                    <BrowserAppListRow key={app.id} app={app} onClick={() => openApp(app)} />
                ))}
            </BrowserAppListCard>
        );
    }

    return (
        <Modal isOpen onClose={onClose} bare>
            <header className="relative flex h-16 shrink-0 items-center justify-center px-16">
                <div className="truncate text-h3 text-textPrimary">{category?.title ?? ''}</div>
                <CloseButton
                    onClick={onClose}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                />
            </header>
            <BrowserSearchBar value={query} onChange={setQuery} onOpenUrl={onSearchUrl} />
            {chains.length > 0 && (
                <div className="px-4 pb-3">
                    <MultichainChainChips value={chain} onChange={setChain} chains={chains} />
                </div>
            )}
            <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-4">{content}</div>
        </Modal>
    );
};
