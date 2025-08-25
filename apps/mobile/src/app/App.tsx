import { QueryClientProvider } from '@tanstack/react-query';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { localizationText } from '@tonkeeper/core/dist/entries/language';
import { getApiConfig, setProApiUrl } from '@tonkeeper/core/dist/entries/network';
import { WalletVersion } from '@tonkeeper/core/dist/entries/wallet';
import { CopyNotification } from '@tonkeeper/uikit/dist/components/CopyNotification';
import { FooterGlobalStyle } from '@tonkeeper/uikit/dist/components/Footer';
import { HeaderGlobalStyle } from '@tonkeeper/uikit/dist/components/Header';
import { DarkThemeContext } from '@tonkeeper/uikit/dist/components/Icon';
import { GlobalListStyle } from '@tonkeeper/uikit/dist/components/List';
import { ModalsRoot } from '@tonkeeper/uikit/dist/components/ModalsRoot';
import QrScanner from '@tonkeeper/uikit/dist/components/QrScanner';
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
import { useDevSettings } from '@tonkeeper/uikit/dist/state/dev';
import { useUserFiatQuery } from '@tonkeeper/uikit/dist/state/fiat';
import { useUserLanguage } from '@tonkeeper/uikit/dist/state/language';
import { useProBackupState } from '@tonkeeper/uikit/dist/state/pro';
import { useTonendpoint, useTonenpointConfig } from '@tonkeeper/uikit/dist/state/tonendpoint';
import {
    useAccountsStateQuery,
    useActiveAccountQuery,
    useActiveTonNetwork
} from '@tonkeeper/uikit/dist/state/wallet';
import { GlobalStyleCss } from '@tonkeeper/uikit/dist/styles/globalStyle';
import { FC, Suspense, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { createGlobalStyle, css } from 'styled-components';
import { CapacitorAppSdk } from '../libs/appSdk';
import { CAPACITOR_APPLICATION_ID } from '../libs/aplication-id';
import { useAnalytics, useAppHeight } from '../libs/hooks';
import { useGlobalPreferencesQuery } from '@tonkeeper/uikit/dist/state/global-preferences';
import { useGlobalSetup } from '@tonkeeper/uikit/dist/state/globalSetup';
import { CapacitorNotifications } from '../libs/capacitorNotifications';
import { NarrowContent } from './app-content/NarrowContent';
import { IonApp, iosTransitionAnimation, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { WideContent } from './app-content/WideContent';
import SignerPublishNotification from '@tonkeeper/uikit/dist/pages/signer/PublishNotification';
import { queryClient } from '../libs/query-client';
import { localesList } from '@tonkeeper/locales/localesList';
import { useAppCountryInfo } from '@tonkeeper/uikit/dist/state/country';

setupIonicReact({
    swipeBackEnabled: true,
    mode: 'ios',
    navAnimation: iosTransitionAnimation
});

const GlobalStyle = createGlobalStyle`
    ${GlobalStyleCss};

    body {
        background: ${p => p.theme.backgroundPage};
        font-family: '-apple-system', BlinkMacSystemFont, Roboto, 'Helvetica Neue', Arial, Tahoma, Verdana, 'sans-serif';
    }
    
    html, body, #root {
        height: 100%;
        overflow: hidden;
    }

    html.is-locked {
        height: var(--app-height);
    }

    button, input[type="submit"], input[type="reset"] {
      background: none;
      color: inherit;
      border: none;
      padding: 0;
      font: inherit;
      cursor: pointer;
      outline: inherit;
    }
    
    * {
      -webkit-touch-callout: none !important;
      -webkit-user-select: none;
      user-select: none;

        ${() =>
            CAPACITOR_APPLICATION_ID === 'tablet' &&
            css`
                overscroll-behavior: none;
            `}
    }

    a {
        -webkit-user-drag: none;
    }
`;

const sdk = new CapacitorAppSdk();

export const Providers = () => {
    const { t: tSimple, i18n } = useTranslation();

    const t = useTWithReplaces(tSimple);

    const translation = useMemo(() => {
        const client: I18nContext = {
            t,
            i18n: {
                enable: true,
                reloadResources: i18n.reloadResources,
                changeLanguage: async (lang: string) => {
                    await i18n.changeLanguage(lang);
                },
                language: i18n.language,
                languages: localesList
            }
        };
        return client;
    }, [t, i18n]);

    useEffect(() => {
        document.body.classList.add(CAPACITOR_APPLICATION_ID);
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            <Suspense fallback={<div></div>}>
                <AppSdkContext.Provider value={sdk}>
                    <TranslationContext.Provider value={translation}>
                        <StorageContext.Provider value={sdk.storage}>
                            <ThemeAndContent />
                        </StorageContext.Provider>
                    </TranslationContext.Provider>
                </AppSdkContext.Provider>
            </Suspense>
        </QueryClientProvider>
    );
};

export const App = () => {
    return (
        <IonApp>
            <IonReactRouter>
                <Providers />
            </IonReactRouter>
        </IonApp>
    );
};

const ThemeAndContent = () => {
    const { data } = useProBackupState();
    return (
        <UserThemeProvider
            displayType="full-width"
            isPro
            isProSupported
            proDisplayType={CAPACITOR_APPLICATION_ID === 'mobile' ? 'mobile' : 'desktop'}
        >
            <DarkThemeContext.Provider value={!data?.valid}>
                <GlobalStyle />
                <HeaderGlobalStyle />
                <FooterGlobalStyle />
                <SybHeaderGlobalStyle />
                <GlobalListStyle />
                <Loader />
                <UnlockNotification sdk={sdk} />
            </DarkThemeContext.Provider>
        </UserThemeProvider>
    );
};

export const Loader: FC = () => {
    const network = useActiveTonNetwork();
    const { data: activeAccount, isLoading: activeWalletLoading } = useActiveAccountQuery();
    const { data: accounts, isLoading: isWalletsLoading } = useAccountsStateQuery();
    const { data: lang, isLoading: isLangLoading } = useUserLanguage();
    const { data: devSettings } = useDevSettings();
    const { isLoading: globalPreferencesLoading } = useGlobalPreferencesQuery();
    const { isLoading: globalSetupLoading } = useGlobalSetup();
    const { data: countryInfo } = useAppCountryInfo();

    const lock = useLock(sdk);
    const { i18n } = useTranslation();
    const { data: fiat } = useUserFiatQuery();

    const tonendpoint = useTonendpoint({
        build: sdk.version,
        network,
        lang,
        platform: CAPACITOR_APPLICATION_ID === 'tablet' ? 'tablet' : 'pro_mobile_ios',
        deviceCountryCode: countryInfo?.deviceCountryCode,
        storeCountryCode: countryInfo?.storeCountryCode
    });
    const { data: config } = useTonenpointConfig(tonendpoint);

    useAppHeight();

    const { data: tracker } = useAnalytics(
        sdk.version,
        config?.mainnetConfig,
        activeAccount!,
        accounts
    );

    useEffect(() => {
        if (lang && i18n.language !== localizationText(lang)) {
            i18n.reloadResources([localizationText(lang)]).then(() =>
                i18n.changeLanguage(localizationText(lang))
            );
        }
    }, [lang, i18n]);

    useEffect(() => {
        if (config && config.mainnetConfig.tonapiIOEndpoint) {
            sdk.notifications = new CapacitorNotifications(config.mainnetConfig, sdk.storage);
        }
    }, [config]);

    if (
        activeWalletLoading ||
        isLangLoading ||
        isWalletsLoading ||
        config === undefined ||
        lock === undefined ||
        fiat === undefined ||
        !devSettings ||
        globalPreferencesLoading ||
        globalSetupLoading
    ) {
        return null;
    }

    // set api url synchronously
    setProApiUrl(config.mainnetConfig.pro_api_url);

    const context: IAppContext = {
        mainnetApi: getApiConfig(config.mainnetConfig),
        testnetApi: getApiConfig(config.testnetConfig),
        fiat,
        mainnetConfig: config.mainnetConfig,
        testnetConfig: config.testnetConfig,
        tonendpoint,
        standalone: true,
        extension: false,
        proFeatures: true,
        experimental: true,
        ios: false,
        defaultWalletVersion: WalletVersion.V5R1,
        tracker: tracker?.track
    };

    return (
        <AppContext.Provider value={context}>
            <Content activeAccount={activeAccount} lock={lock} />
            <CopyNotification />
            <QrScanner />
            <ModalsRoot />
            <SignerPublishNotification />
        </AppContext.Provider>
    );
};

const Content: FC<{
    activeAccount?: Account | null;
    lock: boolean;
}> = props => {
    if (CAPACITOR_APPLICATION_ID === 'mobile') {
        return <NarrowContent {...props} />;
    }

    return <WideContent {...props} />;
};
