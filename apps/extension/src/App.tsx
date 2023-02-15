import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { localizationFrom } from '@tonkeeper/core/dist/entries/language';
import { getTonClient, Network } from '@tonkeeper/core/dist/entries/network';
import { WalletState } from '@tonkeeper/core/dist/entries/wallet';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { CopyNotification } from '@tonkeeper/uikit/dist/components/CopyNotification';
import { Footer } from '@tonkeeper/uikit/dist/components/Footer';
import { Header } from '@tonkeeper/uikit/dist/components/Header';
import { Loading } from '@tonkeeper/uikit/dist/components/Loading';
import {
  ActivitySkeleton,
  CoinSkeleton,
  HomeSkeleton,
  SettingsSkeleton,
} from '@tonkeeper/uikit/dist/components/SKeleton';
import {
  AppContext,
  WalletStateContext,
} from '@tonkeeper/uikit/dist/hooks/appContext';
import {
  AfterImportAction,
  AppSdkContext,
  OnImportAction,
} from '@tonkeeper/uikit/dist/hooks/appSdk';
import { StorageContext } from '@tonkeeper/uikit/dist/hooks/storage';
import {
  I18nContext,
  TranslationContext,
} from '@tonkeeper/uikit/dist/hooks/translation';
import { any, AppRoute } from '@tonkeeper/uikit/dist/libs/routes';
import { Unlock } from '@tonkeeper/uikit/dist/pages/home/Unlock';
import { UnlockNotification } from '@tonkeeper/uikit/dist/pages/home/UnlockNotification';
import ImportRouter from '@tonkeeper/uikit/dist/pages/import';
import {
  Initialize,
  InitializeContainer,
} from '@tonkeeper/uikit/dist/pages/import/Initialize';
import { UserThemeProvider } from '@tonkeeper/uikit/dist/providers/ThemeProvider';
import { useAccountState } from '@tonkeeper/uikit/dist/state/account';
import { useAuthState } from '@tonkeeper/uikit/dist/state/password';
import {
  useTonendpoint,
  useTonenpointConfig,
} from '@tonkeeper/uikit/dist/state/tonendpoint';
import { useActiveWallet } from '@tonkeeper/uikit/dist/state/wallet';
import { Body, Container } from '@tonkeeper/uikit/dist/styles/globalStyle';
import React, {
  FC,
  PropsWithChildren,
  Suspense,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import styled from 'styled-components';
import browser from 'webextension-polyfill';
import { ExtensionAppSdk } from './libs/appSdk';
import { ExtensionStorage } from './libs/storage';

const Settings = React.lazy(
  () => import('@tonkeeper/uikit/dist/pages/settings')
);
const Activity = React.lazy(
  () => import('@tonkeeper/uikit/dist/pages/activity/Activity')
);
const Home = React.lazy(() => import('@tonkeeper/uikit/dist/pages/home/Home'));
const Coin = React.lazy(() => import('@tonkeeper/uikit/dist/pages/coin/Coin'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});
const sdk = new ExtensionAppSdk();
const storage = new ExtensionStorage();

export const App: FC = () => {
  const translation = useMemo(() => {
    const client: I18nContext = {
      t: browser.i18n.getMessage,
      i18n: {
        enable: false,
        reloadResources: async () => {},
        changeLanguage: async () => {},
        language: browser.i18n.getUILanguage(),
        languages: [],
      },
    };
    return client;
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <InitialRedirect>
          <AppSdkContext.Provider value={sdk}>
            <StorageContext.Provider value={storage}>
              <TranslationContext.Provider value={translation}>
                <UserThemeProvider>
                  <Loader />
                  <UnlockNotification sdk={sdk} />
                </UserThemeProvider>
              </TranslationContext.Provider>
            </StorageContext.Provider>
          </AppSdkContext.Provider>
        </InitialRedirect>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

const Wrapper = styled(Container)`
  height: 600px;
`;

const useLock = () => {
  const [lock, setLock] = useState<boolean | undefined>(undefined);
  useEffect(() => {
    storage
      .get<boolean>(AppKey.lock)
      .then((useLock) => setLock(useLock === true));

    const unlock = () => {
      setLock(false);
    };
    sdk.uiEvents.on('unlock', unlock);

    return () => {
      sdk.uiEvents.off('unlock', unlock);
    };
  }, []);
  return lock;
};

export const Loader: FC = React.memo(() => {
  const { data: activeWallet } = useActiveWallet();

  const lock = useLock();
  const { data: account } = useAccountState();
  const { data: auth } = useAuthState();
  const tonendpoint = useTonendpoint(
    sdk.version,
    activeWallet?.network,
    localizationFrom(browser.i18n.getUILanguage())
  );
  const { data: config } = useTonenpointConfig(tonendpoint);

  console.log('Loader', account, auth);

  if (!account || !auth || !config || lock === undefined) {
    return (
      <Wrapper>
        <Loading />
      </Wrapper>
    );
  }

  const network = activeWallet?.network ?? Network.MAINNET;
  const fiat = activeWallet?.fiat ?? FiatCurrencies.USD;

  const context = {
    tonApi: getTonClient(config, network),
    account,
    auth,
    fiat,
    config,
    tonendpoint,
  };

  return (
    <OnImportAction.Provider value={sdk.openExtensionInBrowser}>
      <AfterImportAction.Provider value={sdk.closeExtensionInBrowser}>
        <AppContext.Provider value={context}>
          <Wrapper>
            <Content activeWallet={activeWallet} lock={lock} />
          </Wrapper>
          <CopyNotification />
        </AppContext.Provider>
      </AfterImportAction.Provider>
    </OnImportAction.Provider>
  );
});

const InitialRedirect: FC<PropsWithChildren> = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (window.location.hash) {
      navigate(window.location.hash.substring(1));
    }
  }, []);

  return <>{children}</>;
};

export const Content: FC<{
  activeWallet?: WalletState | null;
  lock: boolean;
}> = ({ activeWallet, lock }) => {
  const location = useLocation();

  if (lock) {
    return <Unlock />;
  }

  if (!activeWallet || location.pathname.startsWith(AppRoute.import)) {
    return (
      <Routes>
        <Route
          path={any(AppRoute.import)}
          element={
            <InitializeContainer fullHeight={false}>
              <ImportRouter />
            </InitializeContainer>
          }
        />
        <Route
          path="*"
          element={
            <InitializeContainer>
              <Initialize />
            </InitializeContainer>
          }
        />
      </Routes>
    );
  }

  return (
    <WalletStateContext.Provider value={activeWallet}>
      <Routes>
        <Route
          path={AppRoute.activity}
          element={
            <Suspense fallback={<ActivitySkeleton />}>
              <Activity />
            </Suspense>
          }
        />
        <Route
          path={any(AppRoute.settings)}
          element={
            <Suspense fallback={<SettingsSkeleton />}>
              <Settings />
            </Suspense>
          }
        />
        <Route path={AppRoute.coins}>
          <Route
            path=":name"
            element={
              <Body>
                <Suspense fallback={<CoinSkeleton />}>
                  <Coin />
                </Suspense>
              </Body>
            }
          />
        </Route>
        <Route
          path="*"
          element={
            <>
              <Header />
              <Body>
                <Suspense fallback={<HomeSkeleton />}>
                  <Home />
                </Suspense>
              </Body>
            </>
          }
        />
      </Routes>
      <Footer />
    </WalletStateContext.Provider>
  );
};
