import { FC, useState } from 'react';

import { searchBrowserApps } from '@tonkeeper/core/dist/service/browserCatalogService';

import { cn } from '../../../../libs/css';
import { useTrackDappBrowserSearch } from '../../../../hooks/analytics/dapp-browser';
import { useIsCapacitorApp } from '../../../../hooks/appSdk';
import { useTranslation } from '../../../../hooks/translation';
import IcMagnifyingGlass16 from '../../../../icons/components/IcMagnifyingGlass16';
import {
    useSearchEngine,
    useSearchEngineName,
    useSearchEngineRecommendations
} from '../../../../state/dapp-browser';
import { useBrowserCatalog } from '../../../../state/multichain/useBrowserCatalog';
import { CloseButton } from '../../../../primitives/CloseButton';
import { ListTitle } from '../ListTitle';
import { Modal } from '../../../../primitives/Modal';
import { BrowserSearchBar } from './BrowserSearchBar';
import { BrowserSearchResults } from './BrowserSearchResults';
import { useBrowserSectionLabel, useOpenBrowserApp, useOpenBrowserDapp } from './browser-utils';

/**
 * The search sheet the catalog's compact search button opens: the section
 * title with a close button, the focused field, the catalog matches — or an
 * "open this address" row for a URL-shaped query — and the search engine's
 * query suggestions under them. The catalog stays mounted behind the dim, so
 * dismissing leaves it as it was.
 *
 * Submitting anything that isn't an address opens the engine's results page,
 * matching the native apps' new-tab search.
 */
export const BrowserSearchModal: FC<{ onClose: () => void }> = ({ onClose }) => {
    const { t } = useTranslation();
    const title = useBrowserSectionLabel();
    const openApp = useOpenBrowserApp();
    const openDapp = useOpenBrowserDapp();
    const { trackSearchOpen, trackSearchResultOpen } = useTrackDappBrowserSearch();

    const [query, setQuery] = useState('');
    const { data: catalog } = useBrowserCatalog();

    const searchUrl = useSearchEngine();
    const engineName = useSearchEngineName();
    // The suggestions endpoint answers without CORS headers, so only the
    // capacitor app — whose fetch goes through the native HTTP plugin — can
    // read it. Elsewhere the query is never sent and the section stays out.
    const canSuggest = useIsCapacitorApp();
    const { data: suggestions } = useSearchEngineRecommendations(canSuggest ? query : '');

    const onOpenUrl = (url: string) => {
        trackSearchOpen(url);
        openDapp(url, 'browser_search');
        onClose();
    };

    return (
        <Modal isOpen onClose={onClose} bare>
            <header className="relative flex h-16 shrink-0 items-center justify-center px-16">
                <div className="text-h3 text-textPrimary">{title}</div>
                <CloseButton
                    onClick={onClose}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                />
            </header>
            <BrowserSearchBar
                value={query}
                onChange={setQuery}
                onOpenUrl={onOpenUrl}
                onSubmitQuery={q => onOpenUrl(searchUrl(q))}
                autoFocus
            />
            <div className="hide-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 pb-4">
                {query.trim() !== '' && catalog !== undefined && (
                    <BrowserSearchResults
                        query={query}
                        matches={searchBrowserApps(catalog, query)}
                        onOpenApp={app => {
                            trackSearchResultOpen(app.url);
                            openApp(app, { from: 'browser_search' });
                            onClose();
                        }}
                        onOpenUrl={onOpenUrl}
                    />
                )}
                {!!suggestions?.length && (
                    <section className="flex flex-col">
                        <ListTitle title={`${engineName} ${t('browser_search')}`} />
                        <div className="overflow-hidden rounded-medium bg-backgroundContent">
                            {suggestions.map((phrase, index) => (
                                <button
                                    key={phrase}
                                    type="button"
                                    onClick={() => onOpenUrl(searchUrl(phrase))}
                                    className={cn(
                                        'flex h-12 w-full cursor-pointer items-center gap-3 px-4 text-left transition-colors duration-100 hover:bg-backgroundContentTint',
                                        index > 0 && 'border-t border-separatorCommon'
                                    )}
                                >
                                    <IcMagnifyingGlass16 className="size-4 shrink-0 text-iconSecondary" />
                                    <span className="truncate text-body2 text-textPrimary">
                                        {phrase}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </Modal>
    );
};
