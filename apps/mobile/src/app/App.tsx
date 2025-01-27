import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { localizationText } from '@tonkeeper/core/dist/entries/language';
import { getApiConfig, Network } from '@tonkeeper/core/dist/entries/network';
import { WalletVersion } from '@tonkeeper/core/dist/entries/wallet';
import { CopyNotification } from '@tonkeeper/uikit/dist/components/CopyNotification';
import { FooterGlobalStyle } from '@tonkeeper/uikit/dist/components/Footer';
import { HeaderGlobalStyle } from '@tonkeeper/uikit/dist/components/Header';
import { DarkThemeContext } from '@tonkeeper/uikit/dist/components/Icon';
import { GlobalListStyle } from '@tonkeeper/uikit/dist/components/List';
import { Loading } from '@tonkeeper/uikit/dist/components/Loading';
import { ModalsRoot } from '@tonkeeper/uikit/dist/components/ModalsRoot';
import QrScanner from '@tonkeeper/uikit/dist/components/QrScanner';
import { SybHeaderGlobalStyle } from '@tonkeeper/uikit/dist/components/SubHeader';
import { AmplitudeAnalyticsContext } from '@tonkeeper/uikit/dist/hooks/amplitude';
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
import { createGlobalStyle } from 'styled-components';
import { CAPACITOR_APPLICATION_ID, CapacitorAppSdk } from '../libs/appSdk';
import { useAnalytics, useAppHeight } from '../libs/hooks';
import { useGlobalPreferencesQuery } from '@tonkeeper/uikit/dist/state/global-preferences';
import { useGlobalSetup } from '@tonkeeper/uikit/dist/state/globalSetup';
import { CapacitorNotifications } from '../libs/capacitorNotifications';
import { homeScreenGradientId, NarrowContent } from './app-content/NarrowContent';
import { createAnimation, IonApp, iosTransitionAnimation, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { IonicOverride } from './app-content/ionic-override';
import type { TransitionOptions } from '@ionic/core/dist/types/utils/transition';
import { mobileProHomePageId } from '@tonkeeper/uikit/dist/mobile-pro-pages/MobileProHomePage';
import { mobileHeaderBackgroundId } from '@tonkeeper/uikit/dist/components/mobile-pro/header/MobileProHeader';
import { WideContent } from './app-content/WideContent';

setupIonicReact({
    swipeBackEnabled: true,
    navAnimation: (navEl: HTMLElement, opts: TransitionOptions) => {
        const isEnteringHomePage = opts.enteringEl.id === mobileProHomePageId;
        const isLeavingHomePage = opts.leavingEl?.id === mobileProHomePageId;

        const baseAnimation = iosTransitionAnimation(navEl, opts);

        if (!isEnteringHomePage && !isLeavingHomePage) {
            return baseAnimation;
        }

        const gradient = document.getElementById(homeScreenGradientId);
        const header = document.getElementById(mobileHeaderBackgroundId);

        if (!gradient || !header) {
            return baseAnimation;
        }

        const gradientAnimation = createAnimation()
            .addElement(gradient)
            .fromTo('opacity', isEnteringHomePage ? '0' : '0.16', isEnteringHomePage ? '0.16' : '0')
            .afterAddWrite(() => {
                if (getComputedStyle(gradient).opacity === '0') {
                    gradient.classList.add('hidden');
                } else {
                    gradient.classList.remove('hidden');
                }
            });

        const headerAnimation = createAnimation()
            .addElement(header)
            .fromTo('opacity', isEnteringHomePage ? '1' : '0', isEnteringHomePage ? '0' : '1')
            .afterAddWrite(() => {
                if (getComputedStyle(header).opacity === '0') {
                    header.classList.add('hidden');
                } else {
                    header.classList.remove('hidden');
                }
            });

        return baseAnimation.addAnimation(headerAnimation).addAnimation(gradientAnimation);
    }
});

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30000,
            refetchOnWindowFocus: false
        }
    }
});

const GlobalStyle = createGlobalStyle`
    ${GlobalStyleCss};
    
    ${IonicOverride};

    body {
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

      overscroll-behavior: none;
    }

    a {
        -webkit-user-drag: none;
    }
`;

const sdk = new CapacitorAppSdk();

const langs = import.meta.env.VITE_APP_LOCALES;

export const Providers = () => {
    const { t: tSimple, i18n } = useTranslation();

    const t = useTWithReplaces(tSimple);

    const translation = useMemo(() => {
        const languages = langs.split(',');
        const client: I18nContext = {
            t,
            i18n: {
                enable: true,
                reloadResources: i18n.reloadResources,
                changeLanguage: async (lang: string) => {
                    await i18n.changeLanguage(lang);
                },
                language: i18n.language,
                languages: languages
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
            isPro={data?.valid}
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

    const lock = useLock(sdk);
    const { i18n } = useTranslation();
    const { data: fiat } = useUserFiatQuery();

    const tonendpoint = useTonendpoint({
        targetEnv: CAPACITOR_APPLICATION_ID,
        build: sdk.version,
        network,
        lang,
        platform: 'tablet' // TODO CAPACITOR_APPLICATION_ID
    });
    const { data: config } = useTonenpointConfig(tonendpoint);

    useAppHeight();

    const { data: tracker } = useAnalytics(sdk.version, activeAccount!, accounts);

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
        return <Loading />;
    }

    const context: IAppContext = {
        mainnetApi: getApiConfig(
            config.mainnetConfig,
            Network.MAINNET,
            import.meta.env.VITE_APP_TONCONSOLE_HOST
        ),
        testnetApi: getApiConfig(config.mainnetConfig, Network.TESTNET),
        fiat,
        mainnetConfig: config.mainnetConfig,
        testnetConfig: config.testnetConfig,
        tonendpoint,
        standalone: true,
        extension: false,
        proFeatures: true,
        experimental: true,
        ios: false,
        env: {
            tgAuthBotId: import.meta.env.VITE_APP_TG_BOT_ID,
            stonfiReferralAddress: import.meta.env.VITE_APP_STONFI_REFERRAL_ADDRESS,
            tronApiKey: import.meta.env.VITE_APP_TRON_API_KEY
        },
        defaultWalletVersion: WalletVersion.V5R1
    };

    return (
        <AmplitudeAnalyticsContext.Provider value={tracker}>
            <AppContext.Provider value={context}>
                <Content activeAccount={activeAccount} lock={lock} />
                <CopyNotification hideSimpleCopyNotifications />
                <QrScanner />
                <ModalsRoot />
            </AppContext.Provider>
        </AmplitudeAnalyticsContext.Provider>
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
