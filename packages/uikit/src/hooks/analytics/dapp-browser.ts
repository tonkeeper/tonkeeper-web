import { useCallback, useEffect, useRef } from 'react';

import { AnalyticsEvent } from '@tonkeeper/core/dist/analytics';
import {
    AnalyticsAssetChain,
    toAnalyticsAssetChains
} from '@tonkeeper/core/dist/analytics/asset-chain';
import { BrowserApp } from '@tonkeeper/core/dist/service/browserCatalogService';

import { useAppContext } from '../appContext';
import { useCountryContextTracker } from './events-hooks';

type DappAppClickEvent = Extract<AnalyticsEvent, { eventName: 'dapp_app_click' }>;
type DappBrowserOpenEvent = Extract<AnalyticsEvent, { eventName: 'dapp_browser_open' }>;

/** Entry point a dApp was opened from, shared by `dapp_app_click` / `dapp_app_loaded`. */
export type DappOpenSource = DappAppClickEvent['from'];

export type DappBrowserOpenSource = DappBrowserOpenEvent['from'];

/** Which of the Browser section's two tabs is showing. */
export type DappBrowserTab = DappBrowserOpenEvent['type'];

/**
 * The dApp identity both halves of the open funnel report, so `dapp_app_click`
 * and `dapp_app_loaded` join on the same key.
 *
 * `appId` is the catalog's backend id. Dapps reached by URL alone — a typed
 * address, a pinned tab, a connected dApp — have none, and the schema requires
 * the field, so they report it empty rather than dropping out of the funnel.
 */
export interface DappAnalyticsIdentity {
    url: string;
    appId: string;
    chain: AnalyticsAssetChain;
    bannerId?: string;
}

/** A dApp known only by its URL: no catalog entry, so no id and no chain. */
export const urlDappIdentity = (url: string): DappAnalyticsIdentity => ({
    url,
    appId: '',
    chain: 'multichain'
});

export const catalogDappIdentity = (
    app: Pick<BrowserApp, 'id' | 'url' | 'chains' | 'bannerId'>
): DappAnalyticsIdentity => ({
    url: app.url,
    appId: app.id,
    chain: toAnalyticsAssetChains(app.chains),
    bannerId: app.bannerId
});

/** The dApp being opened, plus where it was opened from. */
export interface DappOpenContext extends DappAnalyticsIdentity {
    from: DappOpenSource;
}

/**
 * How the Browser section was reached. It's a route, and nothing survives the
 * navigation, so whoever navigates latches the source and the section consumes
 * it on arrival. A section opened without one was reached from the wallet.
 */
let pendingBrowserOpenSource: DappBrowserOpenSource = 'wallet';

export const setDappBrowserOpenSource = (from: DappBrowserOpenSource) => {
    pendingBrowserOpenSource = from;
};

const consumeDappBrowserOpenSource = (): DappBrowserOpenSource => {
    const from = pendingBrowserOpenSource;
    pendingBrowserOpenSource = 'wallet';
    return from;
};

/**
 * `dapp_browser_open` for the Browser section, once per visit. Switching tabs
 * inside the section is a `dapp_browser_tab_click`, not a re-open, so the tab
 * reported here is the one the section opened on.
 */
export const useTrackDappBrowserOpen = (tab: DappBrowserTab = 'explore') => {
    const { tracker } = useAppContext();
    const track = useCountryContextTracker();

    const reported = useRef(false);
    const openedTab = useRef(tab);

    useEffect(() => {
        // `track` no-ops until the tracker resolves; landing straight on the
        // Browser must not latch the visit as reported before then.
        if (!tracker || reported.current) return;
        reported.current = true;

        track(location => ({
            eventName: 'dapp_browser_open',
            from: consumeDappBrowserOpenSource(),
            type: openedTab.current,
            location
        }));
    }, [tracker, track]);
};

export const useTrackDappBrowserTabClick = () => {
    const track = useCountryContextTracker();

    return useCallback(
        (tab: DappBrowserTab) => {
            track(location => ({ eventName: 'dapp_browser_tab_click', type: tab, location }));
        },
        [track]
    );
};

/**
 * `dapp_app_click` — the user tapped a dApp. The intent, not the outcome: the
 * matching `dapp_app_loaded` is what says it actually opened.
 */
export const useTrackDappAppClick = () => {
    const track = useCountryContextTracker();

    return useCallback(
        (dapp: DappOpenContext) => {
            track(location => ({
                eventName: 'dapp_app_click',
                from: dapp.from,
                url: dapp.url,
                asset_chain: dapp.chain,
                app_id: dapp.appId,
                ...(dapp.bannerId !== undefined && { banner_id: dapp.bannerId }),
                location
            }));
        },
        [track]
    );
};

/** `dapp_app_loaded` — the in-app webview finished loading the dApp. */
export const useTrackDappAppLoaded = () => {
    const track = useCountryContextTracker();

    return useCallback(
        (dapp: DappOpenContext, loadDurationMs: number) => {
            track(location => ({
                eventName: 'dapp_app_loaded',
                from: dapp.from,
                url: dapp.url,
                asset_chain: dapp.chain,
                app_id: dapp.appId,
                load_duration_ms: loadDurationMs,
                ...(dapp.bannerId !== undefined && { banner_id: dapp.bannerId }),
                location
            }));
        },
        [track]
    );
};

/**
 * The search half of the Browser. `dapp_browser_search_open` is the search
 * request; `dapp_browser_search_click` is that search being taken into a
 * catalog dapp, and the funnel between them is the share of searches that find
 * one — so a search reaching a plain URL, a search page or a query suggestion
 * reports only the open. Both carry the URL, so a query that merely filters the
 * local catalog has nothing to report until it resolves to one.
 */
export const useTrackDappBrowserSearch = () => {
    const track = useCountryContextTracker();

    const trackSearchOpen = useCallback(
        (url: string) => {
            track(location => ({ eventName: 'dapp_browser_search_open', url, location }));
        },
        [track]
    );

    /** The search and its result land together when a result is what opens. */
    const trackSearchResultOpen = useCallback(
        (url: string) => {
            track(location => ({ eventName: 'dapp_browser_search_open', url, location }));
            track(location => ({ eventName: 'dapp_browser_search_click', url, location }));
        },
        [track]
    );

    return { trackSearchOpen, trackSearchResultOpen };
};
