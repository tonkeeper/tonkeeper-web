import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { localizationText } from '@tonkeeper/core/dist/entries/language';
import { getApiConfig, Network } from '@tonkeeper/core/dist/entries/network';
import { WalletVersion } from '@tonkeeper/core/dist/entries/wallet';
import { CopyNotification } from '@tonkeeper/uikit/dist/components/CopyNotification';
import { DarkThemeContext } from '@tonkeeper/uikit/dist/components/Icon';
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
import { FC, PropsWithChildren, Suspense, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserAppSdk } from './libs/appSdk';
import { useAnalytics, useAppHeight, useApplyQueryParams, useAppWidth } from './libs/hooks';
import { useGlobalPreferencesQuery } from '@tonkeeper/uikit/dist/state/global-preferences';
import { useGlobalSetup } from '@tonkeeper/uikit/dist/state/globalSetup';
import { useWindowsScroll } from '@tonkeeper/uikit/dist/components/Body';
import { useKeyboardHeight } from '@tonkeeper/uikit/dist/pages/import/hooks';
import { useDebuggingTools } from '@tonkeeper/uikit/dist/hooks/useDebuggingTools';
import styled, { createGlobalStyle } from 'styled-components';
import { SwapWidgetPage } from './components/SwapWidgetPage';
import { useAccountsStorage } from '@tonkeeper/uikit/dist/hooks/useStorage';
import { AccountTonWatchOnly } from '@tonkeeper/core/dist/entries/account';
import { getTonkeeperInjectionContext } from './libs/tonkeeper-injection-context';
import { Address } from '@ton/core';
import { defaultLanguage } from './i18n';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30000,
            refetchOnWindowFocus: false
        }
    }
});

const sdk = new BrowserAppSdk();
const TARGET_ENV = 'swap-widget-web';

window.tonkeeperStonfi = {
    address: 'UQD2NmD_lH5f5u1Kj3KfGyTvhZSX0Eg6qp2a5IQUKXxOGzCi',
    sendTransaction: async params => {
        console.log(JSON.stringify(params));
        return 'boc';
    },
    close: () => {
        console.log('close');
    }
};

const queryParams = new URLSearchParams(new URL(window.location.href).search);

const queryParamLangKey = (supportedLanguages: string[]) => {
    let key = queryParams.get('lang');

    if (!key) {
        return undefined;
    }

    if (supportedLanguages.includes(key)) {
        return key;
    }

    if (key.includes('_')) {
        key = key.split('_')[0].toLowerCase();

        return supportedLanguages.includes(key) ? key : undefined;
    }
};

export const App: FC = () => {
    const languages = (import.meta.env.VITE_APP_LOCALES ?? defaultLanguage).split(',');
    const queryParamsLang = queryParamLangKey(languages);

    const { t: tSimple, i18n } = useTranslation();

    useEffect(() => {
        if (queryParamsLang && queryParamsLang !== defaultLanguage) {
            i18n.reloadResources(queryParamsLang).then(() => i18n.changeLanguage(queryParamsLang));
        }
    }, []);

    const t = useTWithReplaces(tSimple);

    const translation = useMemo(() => {
        const client: I18nContext = {
            t,
            i18n: {
                enable: true,
                reloadResources: i18n.reloadResources,
                changeLanguage: i18n.changeLanguage as unknown as (lang: string) => Promise<void>,
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

const WidgetGlobalStyle = createGlobalStyle`
    html, body, #root {
        height: 100%;
    }
    
    * {
        -webkit-tap-highlight-color: transparent;
    }
`;

const ThemeAndContent = () => {
    const { data } = useProBackupState();
    return (
        <UserThemeProvider
            isPro={false}
            isProSupported={false}
            displayType="compact"
            isInsideTonkeeper
        >
            <DarkThemeContext.Provider value={!data?.valid}>
                <GlobalStyle />
                <WidgetGlobalStyle />
                <ProvideActiveAccount>
                    <Loader />
                </ProvideActiveAccount>
            </DarkThemeContext.Provider>
        </UserThemeProvider>
    );
};

const ProvideActiveAccount: FC<PropsWithChildren> = ({ children }) => {
    const storage = useAccountsStorage();
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const addressFriendly = getTonkeeperInjectionContext()?.address;

        if (!addressFriendly) {
            return;
        }

        const addressRaw = Address.parse(addressFriendly).toRawString();

        storage
            .setAccounts([
                new AccountTonWatchOnly(addressRaw, 'Wallet', '🙂', {
                    rawAddress: addressRaw,
                    id: addressRaw
                })
            ])
            .then(() => setIsLoading(false));
    }, []);

    if (isLoading) {
        return null;
    }

    return <>{children}</>;
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
        return null;
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

const Wrapper = styled.div`
    box-sizing: border-box;
    padding: 0 16px 34px;
    height: 100%;
`;

const Content: FC<{
    standalone: boolean;
}> = ({ standalone }) => {
    useWindowsScroll();
    useAppWidth(standalone);
    useKeyboardHeight();
    useTrackLocation();
    useDebuggingTools();
    const isApplied = useApplyQueryParams();

    if (!isApplied) {
        return null;
    }

    return (
        <Wrapper>
            <SwapWidgetPage />
        </Wrapper>
    );
};
