import { useCallback } from 'react';

import { toAnalyticsAssetChains } from '@tonkeeper/core/dist/analytics/asset-chain';
import { BrowserApp } from '@tonkeeper/core/dist/service/browserCatalogService';
import { DAppSource, DAppTrack, formatBrowserUrl } from '@tonkeeper/core/dist/service/urlService';

import { useAppSdk } from '../../../../hooks/appSdk';
import { useTranslation } from '../../../../hooks/translation';
import {
    catalogDappIdentity,
    DappOpenContext,
    DappOpenSource,
    urlDappIdentity,
    useTrackDappAppClick
} from '../../../../hooks/analytics/dapp-browser';
import { useActiveConfig } from '../../../../state/wallet';
import { useOpenBrowserTab } from '../../../../state/dapp-browser';

/**
 * Opens a URL from the Browser screens: in the shell's own dApp browser when
 * it provides one (the capacitor app's native in-app webview), in the
 * external browser otherwise. `options` apply only to the external fallback.
 */
export function useOpenBrowserUrl() {
    const sdk = useAppSdk();
    const { mutate: openTab } = useOpenBrowserTab();

    return useCallback(
        (url: string, options?: { forceExternalBrowser?: boolean; dapp?: DappOpenContext }) => {
            if (sdk.dappBrowser) {
                openTab({ url, dapp: options?.dapp });
            } else {
                sdk.openPage(url, options);
            }
        },
        [sdk, openTab]
    );
}

/**
 * Opens a dApp the user tapped in the Browser: reports `dapp_app_click` and
 * applies the shared UTM tracking. The whole catalog entry is needed, not just
 * its URL — the event carries the backend app and campaign ids.
 *
 * `from` defaults to the surface the UTM source implies; a caller whose surface
 * the UTM vocabulary can't express (the search results) names it outright.
 */
export function useOpenBrowserApp() {
    const trackDappAppClick = useTrackDappAppClick();
    const config = useActiveConfig();
    const openUrl = useOpenBrowserUrl();

    return useCallback(
        (app: BrowserApp, options?: { from?: DappOpenSource; utmSource?: DAppSource }) => {
            const utmSource = options?.utmSource ?? 'recommendation';
            const from = options?.from ?? (utmSource === 'featured' ? 'banner' : 'browser');
            const dapp = { ...catalogDappIdentity(app), from };

            trackDappAppClick(dapp);
            openUrl(formatBrowserUrl(app.url, utmSource, config.tonkeeper_utm_track as DAppTrack), {
                forceExternalBrowser: true,
                dapp
            });
        },
        [openUrl, trackDappAppClick, config.tonkeeper_utm_track]
    );
}

/**
 * Opens a dApp known only by its URL — a typed address, a pinned tab —
 * reporting the click without a catalog identity.
 */
export function useOpenBrowserDapp() {
    const trackDappAppClick = useTrackDappAppClick();
    const openUrl = useOpenBrowserUrl();

    return useCallback(
        (url: string, from: DappOpenSource) => {
            const dapp = { ...urlDappIdentity(url), from };

            trackDappAppClick(dapp);
            openUrl(url, { dapp });
        },
        [openUrl, trackDappAppClick]
    );
}

/**
 * Opens a dApp from the Connected tab. A connection knows the chains it was
 * approved on, which is the one place the dApp's chain is real rather than
 * inferred from the catalog.
 */
export function useOpenConnectedApp() {
    const trackDappAppClick = useTrackDappAppClick();
    const openUrl = useOpenBrowserUrl();

    return useCallback(
        (app: { url: string; chains: string[] }) => {
            const dapp: DappOpenContext = {
                url: app.url,
                appId: '',
                chain: toAnalyticsAssetChains(app.chains),
                from: 'browser_connected'
            };

            trackDappAppClick(dapp);
            openUrl(app.url, { dapp });
        },
        [openUrl, trackDappAppClick]
    );
}

/**
 * What this shell calls the dApp section. The capacitor app opens dApps in its
 * own webview and keeps the native apps' "Browser"; shells that hand them to
 * an external browser call the catalog "Discover".
 */
export function useBrowserSectionLabel(): string {
    const { t } = useTranslation();
    const sdk = useAppSdk();

    return sdk.targetEnv === 'mobile' || sdk.targetEnv === 'tablet'
        ? t('multichain_tab_browser')
        : t('discover_title');
}

const DOMAIN_PATTERN = /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(:\d+)?(\/\S*)?$/i;

/**
 * Detects the "enter address" half of the search field: returns an openable
 * https URL when the input reads as a URL or bare domain, `undefined` when
 * it's a plain search query.
 */
export function typedUrl(input: string): string | undefined {
    const trimmed = input.trim();
    if (trimmed === '' || /\s/.test(trimmed) || !DOMAIN_PATTERN.test(trimmed)) {
        return undefined;
    }
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}
