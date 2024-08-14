import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { localizationText } from '@tonkeeper/core/dist/entries/language';
import { getApiConfig } from '@tonkeeper/core/dist/entries/network';
import { WalletVersion } from '@tonkeeper/core/dist/entries/wallet';
import { CopyNotification } from '@tonkeeper/uikit/dist/components/CopyNotification';
import { FooterGlobalStyle } from '@tonkeeper/uikit/dist/components/Footer';
import { HeaderGlobalStyle } from '@tonkeeper/uikit/dist/components/Header';
import { GlobalListStyle } from '@tonkeeper/uikit/dist/components/List';
import { Loading } from '@tonkeeper/uikit/dist/components/Loading';
import { ModalsRoot } from '@tonkeeper/uikit/dist/components/ModalsRoot';
import { SybHeaderGlobalStyle } from '@tonkeeper/uikit/dist/components/SubHeader';
import { AmplitudeAnalyticsContext } from '@tonkeeper/uikit/dist/hooks/amplitude';
import { AppContext, IAppContext } from '@tonkeeper/uikit/dist/hooks/appContext';
import {
    AfterImportAction,
    AppSdkContext,
    OnImportAction
} from '@tonkeeper/uikit/dist/hooks/appSdk';
import { useLock } from '@tonkeeper/uikit/dist/hooks/lock';
import { StorageContext } from '@tonkeeper/uikit/dist/hooks/storage';
import { I18nContext, TranslationContext } from '@tonkeeper/uikit/dist/hooks/translation';
import { AppRoute } from '@tonkeeper/uikit/dist/libs/routes';
import { UnlockNotification } from '@tonkeeper/uikit/dist/pages/home/UnlockNotification';
import { UserThemeProvider } from '@tonkeeper/uikit/dist/providers/UserThemeProvider';
import { useDevSettings } from '@tonkeeper/uikit/dist/state/dev';
import { useUserFiatQuery } from '@tonkeeper/uikit/dist/state/fiat';
import { useUserLanguage } from '@tonkeeper/uikit/dist/state/language';
import { useTonendpoint, useTonenpointConfig } from '@tonkeeper/uikit/dist/state/tonendpoint';
import {
    useAccountsStateQuery,
    useActiveAccountQuery,
    useActiveTonNetwork
} from '@tonkeeper/uikit/dist/state/wallet';
import { Container, GlobalStyle } from '@tonkeeper/uikit/dist/styles/globalStyle';
import React, { FC, PropsWithChildren, Suspense, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { DesktopView } from './AppDesktop';
import { BrowserAppSdk } from './libs/appSdk';
import { useAnalytics, useAppHeight } from './libs/hooks';

const ImportRouter = React.lazy(() => import('@tonkeeper/uikit/dist/pages/import'));
const Settings = React.lazy(() => import('@tonkeeper/uikit/dist/pages/settings'));
const Browser = React.lazy(() => import('@tonkeeper/uikit/dist/pages/browser'));
const Activity = React.lazy(() => import('@tonkeeper/uikit/dist/pages/activity/Activity'));
const Home = React.lazy(() => import('@tonkeeper/uikit/dist/pages/home/Home'));
const Coin = React.lazy(() => import('@tonkeeper/uikit/dist/pages/coin/Coin'));
const SwapPage = React.lazy(() => import('@tonkeeper/uikit/dist/pages/swap'));
const QrScanner = React.lazy(() => import('@tonkeeper/uikit/dist/components/QrScanner'));
const TonConnectSubscription = React.lazy(
    () => import('@tonkeeper/uikit/dist/components/connect/TonConnectSubscription')
);
const SendActionNotification = React.lazy(
    () => import('@tonkeeper/uikit/dist/components/transfer/SendNotifications')
);
const ReceiveNotification = React.lazy(
    () => import('@tonkeeper/uikit/dist/components/home/ReceiveNotification')
);
const NftNotification = React.lazy(
    () => import('@tonkeeper/uikit/dist/components/nft/NftNotification')
);
const SendNftNotification = React.lazy(
    () => import('@tonkeeper/uikit/dist/components/transfer/nft/SendNftNotification')
);

const PairSignerNotification = React.lazy(
    () => import('@tonkeeper/uikit/dist/components/PairSignerNotification')
);
const PairKeystoneNotification = React.lazy(
    () => import('@tonkeeper/uikit/dist/components/PairKeystoneNotification')
);
const SignerLinkPage = React.lazy(() => import('@tonkeeper/uikit/dist/pages/signer/LinkPage'));
const SignerPublishNotification = React.lazy(
    () => import('@tonkeeper/uikit/dist/pages/signer/PublishNotification')
);

const ConnectLedgerNotification = React.lazy(
    () => import('@tonkeeper/uikit/dist/components/ConnectLedgerNotification')
);
const SwapMobileNotification = React.lazy(
    () => import('@tonkeeper/uikit/dist/pages/swap/SwapMobileNotification')
);

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

export const App: FC<PropsWithChildren> = () => {
    const { t, i18n } = useTranslation();

    const translation = useMemo(() => {
        const languages = (import.meta.env.VITE_APP_LOCALES ?? 'en').split(',');
        const client: I18nContext = {
            t,
            i18n: {
                enable: true,
                reloadResources: i18n.reloadResources,
                changeLanguage: i18n.changeLanguage as any,
                language: i18n.language,
                languages: languages
            }
        };
        return client;
    }, [t, i18n]);

    return (
        <BrowserRouter>
            <QueryClientProvider client={queryClient}>
                <Suspense>
                    <AppSdkContext.Provider value={sdk}>
                        <TranslationContext.Provider value={translation}>
                            <StorageContext.Provider value={sdk.storage}>
                                <UserThemeProvider>
                                    <GlobalStyle />
                                    <HeaderGlobalStyle />
                                    <FooterGlobalStyle />
                                    <SybHeaderGlobalStyle />
                                    <GlobalListStyle />
                                    <Loader />
                                    <UnlockNotification sdk={sdk} />
                                </UserThemeProvider>
                            </StorageContext.Provider>
                        </TranslationContext.Provider>
                    </AppSdkContext.Provider>
                </Suspense>
            </QueryClientProvider>
        </BrowserRouter>
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

export const Loader: FC = () => {
    const network = useActiveTonNetwork();
    const { data: activeAccount, isLoading: activeWalletLoading } = useActiveAccountQuery();
    const { data: accounts, isLoading: isWalletsLoading } = useAccountsStateQuery();
    const { data: lang, isLoading: isLangLoading } = useUserLanguage();
    const { data: fiat } = useUserFiatQuery();
    const { data: devSettings } = useDevSettings();

    const [ios, standalone] = useMemo(() => {
        return [sdk.isIOs(), sdk.isStandalone()] as const;
    }, []);

    const lock = useLock(sdk);
    const { i18n } = useTranslation();

    const tonendpoint = useTonendpoint({
        targetEnv: TARGET_ENV,
        build: sdk.version,
        network,
        lang
    });
    const { data: config } = useTonenpointConfig(tonendpoint);

    const navigate = useNavigate();
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
        config === undefined ||
        lock === undefined ||
        fiat === undefined ||
        !devSettings
    ) {
        return <Loading />;
    }

    const context: IAppContext = {
        api: getApiConfig(config, network, import.meta.env.VITE_APP_TONCOSOLE_HOST),
        fiat,
        config,
        tonendpoint,
        standalone,
        extension: false,
        proFeatures: false,
        ios,
        defaultWalletVersion: WalletVersion.V5R1
    };

    return (
        <AmplitudeAnalyticsContext.Provider value={tracker}>
            <OnImportAction.Provider value={navigate}>
                <AfterImportAction.Provider
                    value={() => navigate(AppRoute.home, { replace: true })}
                >
                    <AppContext.Provider value={context}>
                        <Content
                            activeAccount={activeAccount}
                            lock={lock}
                            standalone={standalone}
                        />
                        <CopyNotification hideSimpleCopyNotifications={!standalone} />
                        <Suspense fallback={<></>}>
                            <QrScanner />
                        </Suspense>
                        <ModalsRoot />
                    </AppContext.Provider>
                </AfterImportAction.Provider>
            </OnImportAction.Provider>
        </AmplitudeAnalyticsContext.Provider>
    );
};

export const Content: FC<{
    activeAccount?: Account | null;
    lock: boolean;
    standalone: boolean;
}> = ({ activeAccount, lock, standalone }) => {
    return <DesktopView activeAccount={activeAccount} lock={lock} />;
};
