import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { Language, localizationText } from '@tonkeeper/core/dist/entries/language';
import { getApiConfig } from '@tonkeeper/core/dist/entries/network';
import { WalletVersion } from '@tonkeeper/core/dist/entries/wallet';
import { defaultTonendpointConfig } from '@tonkeeper/core/dist/tonkeeperApi/tonendpoint';
import { CopyNotification } from '@tonkeeper/uikit/dist/components/CopyNotification';
import { DarkThemeContext } from '@tonkeeper/uikit/dist/components/Icon';
import { GlobalListStyle } from '@tonkeeper/uikit/dist/components/List';
import { Loading } from '@tonkeeper/uikit/dist/components/Loading';
import { AppContext, IAppContext } from '@tonkeeper/uikit/dist/hooks/appContext';
import { AppSdkContext } from '@tonkeeper/uikit/dist/hooks/appSdk';
import { StorageContext } from '@tonkeeper/uikit/dist/hooks/storage';
import {
    I18nContext,
    TranslationContext,
    useTWithReplaces
} from '@tonkeeper/uikit/dist/hooks/translation';
import { useUserFiatQuery } from '@tonkeeper/uikit/dist/state/fiat';
import { useUserLanguage } from '@tonkeeper/uikit/dist/state/language';
import { useTonendpoint, useTonenpointConfig } from '@tonkeeper/uikit/dist/state/tonendpoint';
import { useAccountsStateQuery, useActiveTonNetwork } from '@tonkeeper/uikit/dist/state/wallet';
import { defaultTheme } from '@tonkeeper/uikit/dist/styles/defaultTheme';
import { GlobalStyle } from '@tonkeeper/uikit/dist/styles/globalStyle';
import { lightTheme } from '@tonkeeper/uikit/dist/styles/lightTheme';

import { initViewport } from '@tma.js/sdk';
import { SDKProvider } from '@tma.js/sdk-react';
import { FC, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import StandardErrorBoundary from './components/ErrorBoundary';
import { TwaAppSdk } from './libs/appSdk';
import { useStubAnalytics, useTwaAppViewport, useTwaErrorReporting } from './libs/hooks';
import { MiniAppClosed } from './stub/MiniAppClosed';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30000,
            refetchOnWindowFocus: false
        }
    }
});

export const App = () => {
    return (
        <StandardErrorBoundary>
            <SDKProvider>
                <QueryClientProvider client={queryClient}>
                    <TwaLoader />
                </QueryClientProvider>
            </SDKProvider>
        </StandardErrorBoundary>
    );
};

const TwaLoader = () => {
    const { data: sdk, error } = useQuery(['sdk'], async () => {
        const [willViewport] = initViewport();
        return new TwaAppSdk(await willViewport);
    });

    useEffect(() => {
        if (!sdk) return;

        // Telegram opens mini apps at partial height on mobile (iOS especially);
        // expand to the full available height so the bottom button is reachable.
        // Bots launched via the menu button aren't always in fullscreen mode, so
        // we expand here rather than relying on the bot's Telegram configuration.
        if (!sdk.viewport.isExpanded) {
            sdk.viewport.expand();
        }

        const theme = sdk.miniApp.isDark ? defaultTheme : lightTheme;

        if (sdk.miniApp.supports('setBackgroundColor')) {
            sdk.miniApp.setBgColor(theme.backgroundPage);
        }
        if (sdk.miniApp.supports('setHeaderColor')) {
            sdk.miniApp.setHeaderColor(theme.backgroundPage);
        }

        document.body.style.backgroundColor = theme.backgroundPage;
    }, [sdk]);

    if (error instanceof Error) {
        return <div>{error.message}</div>;
    }

    if (!sdk) {
        return <div />;
    }

    return (
        <AppSdkContext.Provider value={sdk}>
            <ThemeProvider theme={sdk.miniApp.isDark ? defaultTheme : lightTheme}>
                <DarkThemeContext.Provider value={sdk.miniApp.isDark}>
                    <GlobalStyle />
                    <GlobalListStyle />
                    <StubApp sdk={sdk} />
                </DarkThemeContext.Provider>
            </ThemeProvider>
        </AppSdkContext.Provider>
    );
};

const StubApp: FC<{ sdk: TwaAppSdk }> = ({ sdk }) => {
    const { t: tSimple, i18n } = useTranslation();
    const t = useTWithReplaces(tSimple);

    const translation = useMemo<I18nContext>(
        () => ({
            t,
            i18n: {
                enable: false,
                reloadResources: i18n.reloadResources,
                changeLanguage: i18n.changeLanguage as any,
                language: i18n.language,
                languages: []
            }
        }),
        [t, i18n]
    );

    return (
        <BrowserRouter>
            <TranslationContext.Provider value={translation}>
                <StorageContext.Provider value={sdk.storage}>
                    <Loader sdk={sdk} />
                </StorageContext.Provider>
            </TranslationContext.Provider>
        </BrowserRouter>
    );
};

// The TWA never shipped a language picker, so almost no one has a stored
// preference; fall back to the user's Telegram client language. Telegram gives
// an IETF tag (e.g. 'ru', 'en-US', 'zh-hans'); map it to a locale we actually
// ship, or undefined when we don't.
const SUPPORTED_TWA_LOCALES = new Set([
    'en',
    'ru',
    'it',
    'tr',
    'bg',
    'es',
    'id',
    'uk',
    'uz',
    'bn',
    'fr',
    'pa',
    'pt',
    'vi',
    'hi',
    'ar',
    'de',
    'fa'
]);

const telegramLangToLocale = (code?: string): string | undefined => {
    if (!code) return undefined;
    const normalized = code.toLowerCase();
    if (normalized.startsWith('zh')) {
        return /hant|tw|hk|mo/.test(normalized) ? 'zh_TW' : 'zh_CN';
    }
    const base = normalized.split(/[-_]/)[0];
    return SUPPORTED_TWA_LOCALES.has(base) ? base : undefined;
};

const Loader: FC<{ sdk: TwaAppSdk }> = ({ sdk }) => {
    const { data: lang, isLoading: isLangLoading } = useUserLanguage();
    const { data: fiat } = useUserFiatQuery();
    const { data: accounts } = useAccountsStateQuery();
    const network = useActiveTonNetwork();
    const { i18n } = useTranslation();

    useTwaAppViewport(false, sdk);

    // Pick the stub's locale. An explicit non-English preference saved in the
    // old app always wins; otherwise fall back to the Telegram client language
    // (mapped to a supported locale), and finally to English. `useUserLanguage`
    // returns EN both when nothing was ever stored and — since Language.EN is
    // 0/falsy and the picker never existed in the TWA — for every user without
    // a real preference, so EN here reliably means "unset".
    useEffect(() => {
        if (lang === undefined) return;

        const storedLocale = lang !== Language.EN ? localizationText(lang) : undefined;
        const telegramLocale = telegramLangToLocale(sdk.launchParams.initData?.user?.languageCode);
        const targetLocale = storedLocale ?? telegramLocale ?? 'en';

        if (i18n.language !== targetLocale) {
            i18n.reloadResources([targetLocale]).then(() => i18n.changeLanguage(targetLocale));
        }
    }, [lang, i18n, sdk]);

    const tonendpoint = useTonendpoint({
        build: sdk.version,
        network,
        lang,
        platform: 'twa'
    });
    const { data: serverConfig } = useTonenpointConfig(tonendpoint);

    const { data: tracker } = useStubAnalytics(
        accounts,
        network,
        sdk.version,
        serverConfig?.mainnetConfig
    );

    // Revealing a recovery phrase is pure client-side crypto over locally stored
    // account data, so the stub must reach MiniAppClosed even with no network.
    // The Tonendpoint config only feeds the api clients and analytics, neither of
    // which the offline recovery path touches, so fall back to defaults until it
    // loads rather than blocking the whole UI on it.
    const context = useMemo<IAppContext>(() => {
        const mainnetConfig = serverConfig?.mainnetConfig ?? defaultTonendpointConfig;
        const testnetConfig = serverConfig?.testnetConfig ?? defaultTonendpointConfig;
        return {
            mainnetApi: getApiConfig(mainnetConfig),
            testnetApi: getApiConfig(testnetConfig),
            fiat: fiat ?? FiatCurrencies.USD,
            mainnetConfig,
            testnetConfig,
            tonendpoint,
            standalone: true,
            extension: false,
            ios: true,
            proFeatures: false,
            hideLedger: true,
            hideSigner: true,
            hideKeystone: true,
            hideQrScanner: true,
            hideMam: true,
            hideMultisig: true,
            hideFireblocks: true,
            defaultWalletVersion: WalletVersion.V5R1,
            browserLength: 4,
            tracker: tracker?.track
        };
    }, [serverConfig, fiat, tonendpoint, tracker]);

    if (isLangLoading) {
        return <Loading />;
    }

    return (
        <AppContext.Provider value={context}>
            {/* Registers the error reporter here, inside the provider, so
                useAnalyticsTrack reads the real tracker instead of the default
                context's undefined one. */}
            <ErrorReporting />
            <MiniAppClosed sdk={sdk} />
            <CopyNotification />
        </AppContext.Provider>
    );
};

const ErrorReporting: FC = () => {
    useTwaErrorReporting();
    return null;
};
