import type { RenderedScreen } from './App';
import { hasRecoverableSecret } from './accounts';
import { NEW_ORIGIN } from './config';
import { navigationTarget, resolveMigrationScreen } from './routing';
import {
    dropMetaEncryptionMap,
    hasMigrated,
    hasWalletData,
    readLanguage,
    readStorageSnapshot
} from './storage';
import {
    deliverTgAuthResult,
    readTgAuthResult,
    TgAuthWindow,
    tgAuthForwardTarget
} from './telegramAuth';

/**
 * Every screen here acts on this origin's wallet data, so none of them is shown
 * inside another page's frame. The hosting layer already refuses to be framed;
 * this covers a deploy that lost its headers.
 */
const isFramed = (): boolean => {
    try {
        return window.self !== window.top;
    } catch {
        return true;
    }
};

const tgAuthResult = readTgAuthResult(window.location.hash);
const tgAuthDelivered =
    tgAuthResult !== undefined &&
    deliverTgAuthResult(tgAuthResult, window as unknown as TgAuthWindow, NEW_ORIGIN);

const tgAuthForward =
    tgAuthResult !== undefined && !tgAuthDelivered
        ? tgAuthForwardTarget(window.location, NEW_ORIGIN)
        : undefined;

// A result nobody asked for is dropped, so it isn't carried on to the new origin.
if (tgAuthResult !== undefined && !tgAuthDelivered && !tgAuthForward) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
}

dropMetaEncryptionMap();

const storage = readStorageSnapshot();
const screen = resolveMigrationScreen({
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
    newOrigin: NEW_ORIGIN,
    hasWalletData: hasWalletData(storage),
    hasMigrated: hasMigrated(storage),
    hasRecoverableSecret: hasRecoverableSecret(storage),
    hasOpener: Boolean(window.opener),
    isHomeScreenApp: (navigator as { standalone?: boolean }).standalone === true,
    language: readLanguage(storage)
});

const target = navigationTarget(screen, NEW_ORIGIN);

/**
 * React, the styles, the strings and every screen load only for a visit that
 * shows one, so a navigation — above all the new origin's check, which every
 * first visit there makes — waits on nothing but this module.
 */
const render = async (rendered: RenderedScreen) => {
    const [{ createElement }, { createRoot }, { App }] = await Promise.all([
        import('react'),
        import('react-dom/client'),
        import('./App'),
        import('./styles.css'),
        import('./i18n').then(({ loadLocale, resolveLocale }) => loadLocale(resolveLocale(storage)))
    ]);

    createRoot(document.getElementById('root') as HTMLElement).render(
        createElement(App, { screen: rendered })
    );
};

if (tgAuthDelivered) {
    // The mobile app closes its browser tab and a popup closes itself; this page has nothing to show.
} else if (tgAuthForward) {
    window.location.replace(tgAuthForward);
} else if (target) {
    // `replace` keeps this origin out of the back stack, so Back from the new
    // origin doesn't bounce straight back here.
    window.location.replace(target);
} else if (!isFramed()) {
    render(screen as RenderedScreen);
}
