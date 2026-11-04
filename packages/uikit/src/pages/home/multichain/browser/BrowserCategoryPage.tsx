import { FC, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';

import {
    catalogChains,
    filterCategoriesByChain,
    searchBrowserApps
} from '@tonkeeper/core/dist/service/browserCatalogService';

import { useTrackDappBrowserSearch } from '../../../../hooks/analytics/dapp-browser';
import { useNavigateBack } from '../../../../hooks/router/useNavigateBack';
import { useTranslation } from '../../../../hooks/translation';
import { MultichainRoute } from '../../../../libs/routes';
import { SkeletonScope } from '../../../../primitives';
import { ModalCenterError } from '../../../../components/shared/ModalCenterState';
import IcExclamationmarkCircle28 from '../../../../icons/components/IcExclamationmarkCircle28';
import { useBrowserCatalog } from '../../../../state/multichain/useBrowserCatalog';
import { BackButton } from '../../../../primitives/BackButton';
import { MultichainChainChips } from '../MultichainChainChips';
import { MultichainMobileTabBar } from '../MultichainMobileTabBar';
import { PLACEHOLDER_BROWSER_APPS } from '../multichain-placeholders';
import { BrowserAppListCard, BrowserAppListRow } from './BrowserAppListRow';
import { BrowserSearchBar } from './BrowserSearchBar';
import { BrowserSearchResults } from './BrowserSearchResults';
import { useOpenBrowserApp, useOpenBrowserDapp } from './browser-utils';

/**
 * Routed category "See All" page (Figma "Lending/See_all"): back header with
 * the category title, the chain-filter chips (seeded by the `chain` query
 * param the Explore tab passes along) and the category's apps as a
 * description list. Typing in the bottom search field narrows the list to
 * this category's matches.
 */
export const BrowserCategoryPage: FC<{ compact?: boolean }> = ({ compact = false }) => {
    const { t } = useTranslation();
    const openApp = useOpenBrowserApp();
    const openDapp = useOpenBrowserDapp();
    const navigateBack = useNavigateBack(MultichainRoute.browser);
    const { trackSearchOpen, trackSearchResultOpen } = useTrackDappBrowserSearch();

    const { id } = useParams<{ id: string }>();
    const { search } = useLocation();
    const initialChain = new URLSearchParams(search).get('chain') ?? undefined;
    const [chain, setChain] = useState<string | undefined>(initialChain);
    const [query, setQuery] = useState('');

    const { data: catalog, isError, refetch } = useBrowserCatalog();
    const category = catalog?.categories.find(c => c.id === id);

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
    if (catalog === undefined && isError) {
        content = (
            <div className="pt-16">
                <ModalCenterError icon={<IcExclamationmarkCircle28 />} onRetry={() => refetch()} />
            </div>
        );
    } else if (catalog === undefined) {
        content = (
            <SkeletonScope loading>
                <BrowserAppListCard>
                    {PLACEHOLDER_BROWSER_APPS.map(app => (
                        <BrowserAppListRow key={app.id} app={app} onClick={() => undefined} />
                    ))}
                </BrowserAppListCard>
            </SkeletonScope>
        );
    } else if (searching && category !== undefined) {
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

    const searchBar = (
        <BrowserSearchBar value={query} onChange={setQuery} onOpenUrl={onSearchUrl} />
    );

    return (
        <>
            <div className="mx-auto flex w-full max-w-[520px] flex-col gap-2 px-4 pb-4 text-textPrimary">
                <header className="relative -mx-4 flex h-16 shrink-0 items-center justify-center px-16">
                    <div className="truncate text-h3 text-textPrimary">{category?.title ?? ''}</div>
                    <BackButton
                        onClick={navigateBack}
                        className="absolute left-2 top-1/2 -translate-y-1/2"
                    />
                </header>
                {chains.length > 0 && (
                    <MultichainChainChips value={chain} onChange={setChain} chains={chains} />
                )}
                {content}
            </div>
            {compact ? (
                <div className="sticky bottom-0 mx-auto w-full max-w-[520px] bg-backgroundPage px-4 py-2">
                    {searchBar}
                </div>
            ) : (
                <>
                    <div className="h-36" aria-hidden />
                    <MultichainMobileTabBar topContent={searchBar} />
                </>
            )}
        </>
    );
};
