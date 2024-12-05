import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { localizationText } from '@tonkeeper/core/dist/entries/language';
import { getApiConfig, Network } from '@tonkeeper/core/dist/entries/network';
import { WalletVersion } from '@tonkeeper/core/dist/entries/wallet';
import { CopyNotification } from '@tonkeeper/uikit/dist/components/CopyNotification';
import { FooterGlobalStyle } from '@tonkeeper/uikit/dist/components/Footer';
import { HeaderGlobalStyle } from '@tonkeeper/uikit/dist/components/Header';
import { DarkThemeContext } from '@tonkeeper/uikit/dist/components/Icon';
import { GlobalListStyle } from '@tonkeeper/uikit/dist/components/List';
import { Loading } from '@tonkeeper/uikit/dist/components/Loading';
import { SybHeaderGlobalStyle } from '@tonkeeper/uikit/dist/components/SubHeader';
import { AmplitudeAnalyticsContext, useTrackLocation } from '@tonkeeper/uikit/dist/hooks/amplitude';
import { AppContext, IAppContext } from '@tonkeeper/uikit/dist/hooks/appContext';
import { AppSdkContext } from '@tonkeeper/uikit/dist/hooks/appSdk';
import { StorageContext } from '@tonkeeper/uikit/dist/hooks/storage';
import {
    I18nContext,
    TranslationContext,
    useTWithReplaces
} from '@tonkeeper/uikit/dist/hooks/translation';
import { UserThemeProvider } from '@tonkeeper/uikit/dist/providers/UserThemeProvider';
import { useDevSettings } from '@tonkeeper/uikit/dist/state/dev';
import { useUserFiatQuery } from '@tonkeeper/uikit/dist/state/fiat';
import { useUserLanguage } from '@tonkeeper/uikit/dist/state/language';
import { useProBackupState } from '@tonkeeper/uikit/dist/state/pro';
import { useTonendpoint, useTonenpointConfig } from '@tonkeeper/uikit/dist/state/tonendpoint';
import { useAccountsStateQuery, useActiveAccountQuery } from '@tonkeeper/uikit/dist/state/wallet';
import { GlobalStyle } from '@tonkeeper/uikit/dist/styles/globalStyle';
import { FC, Suspense, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserAppSdk } from './libs/appSdk';
import { useAnalytics, useAppHeight, useAppWidth } from './libs/hooks';
import { useGlobalPreferencesQuery } from '@tonkeeper/uikit/dist/state/global-preferences';
import { useGlobalSetup } from '@tonkeeper/uikit/dist/state/globalSetup';
import { useWindowsScroll } from '@tonkeeper/uikit/dist/components/Body';
import { useKeyboardHeight } from '@tonkeeper/uikit/dist/pages/import/hooks';
import { useDebuggingTools } from '@tonkeeper/uikit/dist/hooks/useDebuggingTools';
import MemoryScroll from '@tonkeeper/uikit/dist/components/MemoryScroll';
import styled, { css } from 'styled-components';
import { SwapWidgetPage } from './components/SwapWidgetPage';
import { Container } from '@tonkeeper/uikit';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30000,
            refetchOnWindowFocus: false
        }
    }
});

const sdk = new BrowserAppSdk();
const TARGET_ENV = 'web';

export const App: FC = () => {
    const { t: tSimple, i18n } = useTranslation();

    const t = useTWithReplaces(tSimple);

    const translation = useMemo(() => {
        const languages = (import.meta.env.VITE_APP_LOCALES ?? 'en').split(',');
        const client: I18nContext = {
            t,
            i18n: {
                enable: true,
                reloadResources: i18n.reloadResources,
                changeLanguage: i18n.changeLanguage as (lang: string) => Promise<void>,
                language: i18n.language,
                languages: languages
            }
        };
        return client;
    }, [t, i18n]);

    return (
        <QueryClientProvider client={queryClient}>
            <Suspense>
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

const ThemeAndContent = () => {
    const { data } = useProBackupState();
    return (
        <UserThemeProvider isPro={false} isProSupported={false} displayType="compact">
            <DarkThemeContext.Provider value={!data?.valid}>
                <GlobalStyle />
                <HeaderGlobalStyle />
                <FooterGlobalStyle />
                <SybHeaderGlobalStyle />
                <GlobalListStyle />
                <Loader />
            </DarkThemeContext.Provider>
        </UserThemeProvider>
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

    const { i18n } = useTranslation();

    const tonendpoint = useTonendpoint({
        targetEnv: TARGET_ENV,
        build: sdk.version,
        lang
    });
    const { data: serverConfig } = useTonenpointConfig(tonendpoint);

    useAppHeight();

    const { data: tracker } = useAnalytics(activeAccount || undefined, accounts, sdk.version);

    useEffect(() => {
        if (activeAccount && lang && i18n.language !== localizationText(lang)) {
            i18n.reloadResources([localizationText(lang)]).then(() =>
                i18n.changeLanguage(localizationText(lang))
            );
        }
    }, [activeAccount, i18n]);

    if (
        isWalletsLoading ||
        activeWalletLoading ||
        isLangLoading ||
        serverConfig === undefined ||
        fiat === undefined ||
        !devSettings ||
        globalPreferencesLoading ||
        globalSetupLoading
    ) {
        return <Loading />;
    }

    const context: IAppContext = {
        mainnetApi: getApiConfig(
            serverConfig.mainnetConfig,
            Network.MAINNET,
            import.meta.env.VITE_APP_TONCONSOLE_HOST
        ),
        testnetApi: getApiConfig(serverConfig.mainnetConfig, Network.TESTNET),
        fiat,
        mainnetConfig: serverConfig.mainnetConfig,
        testnetConfig: serverConfig.testnetConfig,
        tonendpoint,
        standalone,
        extension: false,
        proFeatures: false,
        ios,
        defaultWalletVersion: WalletVersion.V5R1,
        hideMultisig: true,
        env: {
            tgAuthBotId: import.meta.env.VITE_APP_TG_BOT_ID,
            stonfiReferralAddress: import.meta.env.VITE_APP_STONFI_REFERRAL_ADDRESS
        }
    };

    return (
        <AmplitudeAnalyticsContext.Provider value={tracker}>
            <AppContext.Provider value={context}>
                <Content standalone={standalone} />
                <CopyNotification hideSimpleCopyNotifications={!standalone} />
            </AppContext.Provider>
        </AmplitudeAnalyticsContext.Provider>
    );
};

const FullSizeWrapper = styled(Container)<{ standalone: boolean }>`
    ${props =>
        props.standalone
            ? css`
                  position: fixed;
                  top: 0;
                  height: calc(var(--app-height) - 2px);
                  -webkit-overflow-scrolling: touch;
              `
            : css`
                  @media (min-width: 600px) {
                      border-left: 1px solid ${props.theme.separatorCommon};
                      border-right: 1px solid ${props.theme.separatorCommon};
                  }
              `};

    > * {
        ${props =>
            props.standalone &&
            css`
                overflow: auto;
                width: var(--app-width);
                max-width: 548px;
                box-sizing: border-box;
            `}
    }
`;

const Wrapper = styled(FullSizeWrapper)<{ standalone: boolean }>`
    box-sizing: border-box;
    padding-top: 64px;
    padding-bottom: ${props => (props.standalone ? '96' : '80')}px;
`;

const Content: FC<{
    standalone: boolean;
}> = ({ standalone }) => {
    useWindowsScroll();
    useAppWidth(standalone);
    useKeyboardHeight();
    useTrackLocation();
    useDebuggingTools();

    return (
        <Wrapper standalone={standalone}>
            <SwapWidgetPage />
        </Wrapper>
    );
};
