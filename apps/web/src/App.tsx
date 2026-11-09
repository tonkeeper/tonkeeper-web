import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { localizationText } from '@tonkeeper/core/dist/entries/language';
import { getApiConfig, setProApiUrl } from '@tonkeeper/core/dist/entries/network';
import { initChainKit } from '@tonkeeper/core/dist/service/chainkit/initChainKit';
import { WEB_PUSH_APP_ID } from '@tonkeeper/core/dist/service/chainkit/deviceAuthService';
import { WalletVersion } from '@tonkeeper/core/dist/entries/wallet';
import { DocumentLanguageSync } from '@tonkeeper/uikit/dist/components/DocumentLanguageSync';
import { CopyNotification } from '@tonkeeper/uikit/dist/components/CopyNotification';
import { ProTrialTelegramReturn } from '@tonkeeper/uikit/dist/components/pro/ProTrialTelegramReturn';
// Header/Footer disabled while multichain home stabilises.
// import { FooterGlobalStyle } from '@tonkeeper/uikit/dist/components/Footer';
// import { HeaderGlobalStyle } from '@tonkeeper/uikit/dist/components/Header';
import { GlobalListStyle } from '@tonkeeper/uikit/dist/components/List';
import { Loading } from '@tonkeeper/uikit/dist/components/Loading';
import { ModalsRoot } from '@tonkeeper/uikit/dist/components/ModalsRoot';
import { SybHeaderGlobalStyle } from '@tonkeeper/uikit/dist/components/SubHeader';
import { AppContext, IAppContext } from '@tonkeeper/uikit/dist/hooks/appContext';
import { AppSdkContext } from '@tonkeeper/uikit/dist/hooks/appSdk';
import { useLock } from '@tonkeeper/uikit/dist/hooks/lock';
import { StorageContext } from '@tonkeeper/uikit/dist/hooks/storage';
import {
    I18nContext,
    TranslationContext,
    useTWithReplaces
} from '@tonkeeper/uikit/dist/hooks/translation';
import { UnlockNotification } from '@tonkeeper/uikit/dist/pages/home/UnlockNotification';
import { UserThemeProvider } from '@tonkeeper/uikit/dist/providers/UserThemeProvider';
import { RootErrorBoundary } from '@tonkeeper/uikit/dist/components/shared/RootErrorBoundary';
import { useDevSettings } from '@tonkeeper/uikit/dist/state/dev';
import { useUserFiatQuery } from '@tonkeeper/uikit/dist/state/fiat';
import { useUserLanguage } from '@tonkeeper/uikit/dist/state/language';
import { useProApiUrl, useProBackupState } from '@tonkeeper/uikit/dist/state/pro';
import { useTonendpoint, useTonenpointConfig } from '@tonkeeper/uikit/dist/state/tonendpoint';
import {
    useAccountsState,
    useAccountsStateQuery,
    useActiveAccountQuery,
    useMutateActiveAccount
} from '@tonkeeper/uikit/dist/state/wallet';
import { GlobalStyle } from '@tonkeeper/uikit/dist/styles/globalStyle';
import React, { FC, PropsWithChildren, Suspense, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MobileView } from './AppMobile';
import { BrowserAppSdk } from './libs/appSdk';
import { useAnalytics, useAppHeight, useLayout } from './libs/hooks';
import { useGlobalPreferencesQuery } from '@tonkeeper/uikit/dist/state/global-preferences';
import { UiShowcase } from '@tonkeeper/uikit/dist/pages/showcase/UiShowcase';
import { useGlobalSetup } from '@tonkeeper/uikit/dist/state/globalSetup';
import { useIsActiveAccountMultisig } from '@tonkeeper/uikit/dist/state/multisig';
import { BrowserRouter } from 'react-router-dom';
import { localesList } from '@tonkeeper/locales/localesList';
import { CryptoStrategyInstaller } from '@tonkeeper/uikit/dist/components/pro/CryptoStrategyInstaller';
import { isMultichainEnabled } from '@tonkeeper/core/dist/multichain';
import { StartScreenExtraActionContext } from '@tonkeeper/uikit/dist/hooks/startScreenExtraAction';
import { MIGRATE_ROUTE } from './migration/config';
import { MigrateRoute } from './migration/MigrateRoute';
import { OldOriginCheck } from './migration/OldOriginCheck';
import { OldOriginEntry } from './migration/OldOriginEntry';

const QrScanner = React.lazy(() => import('@tonkeeper/uikit/dist/components/QrScanner'));
const DesktopView = React.lazy(() => import('./AppDesktop'));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30000,
            refetchOnWindowFocus: false
        }
    }
});

const sdk = new BrowserAppSdk();
initChainKit(sdk.storage, {
    platform: 'web',
    appId: WEB_PUSH_APP_ID,
    clientVersion: sdk.version
});

export const App: FC = () => {
    return (
        <BrowserRouter>
            <Providers />
        </BrowserRouter>
    );
};

const Providers: FC<PropsWithChildren> = () => {
    const { t: tSimple, i18n } = useTranslation();

    const t = useTWithReplaces(tSimple);

    const translation = useMemo(() => {
        const client: I18nContext = {
            t,
            i18n: {
                enable: true,
                reloadResources: i18n.reloadResources,
                changeLanguage: i18n.changeLanguage as any,
                language: i18n.language,
                languages: localesList
            }
        };
        return client;
    }, [t, i18n]);

    return (
        <QueryClientProvider client={queryClient}>
            <Suspense>
                <AppSdkContext.Provider value={sdk}>
                    <TranslationContext.Provider value={translation}>
                        <DocumentLanguageSync />
                        <StorageContext.Provider value={sdk.storage}>
                            <ThemeAndContent />
                        </StorageContext.Provider>
                    </TranslationContext.Provider>
                </AppSdkContext.Provider>
            </Suspense>
        </QueryClientProvider>
    );
};

/**
 * The way back to the origin the wallet moved from, offered under the start
 * screen's own two buttons. One stable element, so the start screen and the
 * boot screen that hands over to it reserve exactly the same room for it.
 */
const startScreenExtraAction = <OldOriginEntry />;

const ThemeAndContent = () => {
    const { data } = useProBackupState();
    const isMobile = useLayout();

    // Temporary DEV-only route for eyeballing every primitive in one place. Renders
    // before the wallet/lock gate so it's reachable without an unlocked account.
    const isShowcase = import.meta.env.DEV && window.location.pathname.startsWith('/ui-showcase');

    // Landing for a handoff from the previous origin. Also above the wallet gate:
    // it has to answer before any account exists, and it must never fall through
    // to a wallet route while a payload is still in the URL.
    const isMigrate = window.location.pathname.startsWith(MIGRATE_ROUTE);

    return (
        <StartScreenExtraActionContext.Provider value={startScreenExtraAction}>
            <UserThemeProvider
                isPro={Boolean(data?.valid)}
                isProSupported
                proDisplayType="desktop"
                displayType={isMobile ? 'compact' : 'full-width'}
            >
                <GlobalStyle />
                <SybHeaderGlobalStyle />
                <GlobalListStyle />
                {isShowcase ? (
                    <UiShowcase />
                ) : isMigrate ? (
                    <MigrateRoute />
                ) : (
                    <OldOriginCheck>
                        <RootErrorBoundary>
                            <Loader />
                        </RootErrorBoundary>
                        <UnlockNotification sdk={sdk} />
                    </OldOriginCheck>
                )}
            </UserThemeProvider>
        </StartScreenExtraActionContext.Provider>
    );
};

const Loader: FC = () => {
    const { data: activeAccount, isLoading: activeWalletLoading } = useActiveAccountQuery();
    const { data: accounts, isLoading: isWalletsLoading } = useAccountsStateQuery();
    const { data: lang, isLoading: isLangLoading } = useUserLanguage();
    const { data: fiat } = useUserFiatQuery();
    const { data: devSettings } = useDevSettings();
    const { isLoading: globalPreferencesLoading } = useGlobalPreferencesQuery();
    const { isLoading: globalSetupLoading } = useGlobalSetup();

    const [ios, standalone] = useMemo(() => {
        return [sdk.isIOs(), sdk.isStandalone()] as const;
    }, []);

    const lock = useLock(sdk);
    const { i18n } = useTranslation();

    const tonendpoint = useTonendpoint({
        build: sdk.version,
        lang,
        platform: 'web'
    });
    const { data: serverConfig } = useTonenpointConfig(tonendpoint);
    const { data: proApiUrl } = useProApiUrl(serverConfig?.mainnetConfig);

    useAppHeight();

    const { data: tracker } = useAnalytics(
        activeAccount || undefined,
        accounts,
        sdk.version,
        serverConfig?.mainnetConfig
    );

    useEffect(() => {
        if (activeAccount && lang && i18n.language !== localizationText(lang)) {
            i18n.reloadResources([localizationText(lang)]).then(() =>
                i18n.changeLanguage(localizationText(lang))
            );
        }
    }, [activeAccount, i18n]);

    const isMobile = useLayout();

    if (
        isWalletsLoading ||
        activeWalletLoading ||
        isLangLoading ||
        serverConfig === undefined ||
        lock === undefined ||
        fiat === undefined ||
        proApiUrl === undefined ||
        !devSettings ||
        globalPreferencesLoading ||
        globalSetupLoading
    ) {
        return <Loading />;
    }

    // set api url synchronously
    setProApiUrl(proApiUrl);

    const context: IAppContext = {
        mainnetApi: getApiConfig(serverConfig.mainnetConfig),
        testnetApi: getApiConfig(serverConfig.testnetConfig),
        fiat,
        mainnetConfig: serverConfig.mainnetConfig,
        testnetConfig: serverConfig.testnetConfig,
        tonendpoint,
        standalone,
        extension: false,
        proFeatures: true,
        ios,
        hideQrScanner: true,
        defaultWalletVersion: WalletVersion.V5R1,
        hideMultisig: isMobile,
        hideFireblocks: true,
        multichainEnabled: isMultichainEnabled(),
        tracker: tracker?.track
    };

    return (
        <AppContext.Provider value={context}>
            <CryptoStrategyInstaller>
                <Content activeAccount={activeAccount} lock={lock} standalone={standalone} />
                <CopyNotification hideSimpleCopyNotifications={!standalone} />
                <Suspense>
                    <QrScanner />
                </Suspense>
                <ModalsRoot />
                <ProTrialTelegramReturn />
            </CryptoStrategyInstaller>
        </AppContext.Provider>
    );
};

const Content: FC<{
    activeAccount?: Account | null;
    lock: boolean;
    standalone: boolean;
}> = ({ activeAccount, lock, standalone }) => {
    const isMobile = useLayout();
    const accounts = useAccountsState();
    const isActiveMultisig = useIsActiveAccountMultisig();
    const { mutate: setActiveAccount } = useMutateActiveAccount();

    useEffect(() => {
        if (isMobile && isActiveMultisig) {
            const firstNotMultisig = accounts.filter(a => a.type !== 'ton-multisig')[0];
            if (firstNotMultisig) {
                setActiveAccount(firstNotMultisig.id);
            }
        }
    }, [isMobile, isActiveMultisig, setActiveAccount]);

    if (isMobile) {
        return <MobileView activeAccount={activeAccount} lock={lock} standalone={standalone} />;
    } else {
        return (
            <Suspense fallback={<Loading />}>
                <DesktopView activeAccount={activeAccount} lock={lock} />
            </Suspense>
        );
    }
};
