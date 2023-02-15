import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Language, languages } from '@tonkeeper/core/dist/entries/language';
import { Footer } from '@tonkeeper/uikit/dist/components/Footer';
import { Header } from '@tonkeeper/uikit/dist/components/Header';
import { AppSdkContext } from '@tonkeeper/uikit/dist/hooks/appSdk';
import { StorageContext } from '@tonkeeper/uikit/dist/hooks/storage';
import {
  I18nContext,
  TranslationContext,
} from '@tonkeeper/uikit/dist/hooks/translation';
import { any, AppRoute } from '@tonkeeper/uikit/dist/libs/routes';
import { UserThemeProvider } from '@tonkeeper/uikit/dist/providers/ThemeProvider';
import { Body, Container } from '@tonkeeper/uikit/dist/styles/globalStyle';
import React, { FC, PropsWithChildren, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { DesktopAppSdk } from './libs/appSdk';
import { DesktopStorage } from './libs/storage';

const SettingsRouter = React.lazy(
  () => import('@tonkeeper/uikit/dist/pages/settings')
);

const queryClient = new QueryClient();
const sdk = new DesktopAppSdk();
const storage = new DesktopStorage();

export const Providers: FC<PropsWithChildren> = ({ children }) => {
  const { t, i18n } = useTranslation();

  const translation = useMemo(() => {
    const client: I18nContext = {
      t,
      i18n: {
        enable: true,
        reloadResources: i18n.reloadResources,
        changeLanguage: i18n.changeLanguage as any,
        language: i18n.language as Language,
        languages: [...languages],
      },
    };
    return client;
  }, [t, i18n]);

  return (
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <AppSdkContext.Provider value={sdk}>
          <StorageContext.Provider value={storage}>
            <TranslationContext.Provider value={translation}>
              <UserThemeProvider>{children}</UserThemeProvider>
            </TranslationContext.Provider>
          </StorageContext.Provider>
        </AppSdkContext.Provider>
      </QueryClientProvider>
    </MemoryRouter>
  );
};

export const App = () => {
  return (
    <Container>
      <Body>
        <Routes>
          <Route path={AppRoute.activity} element={<>Activity</>} />
          <Route path={any(AppRoute.settings)} element={<SettingsRouter />} />
          <Route
            path="*"
            element={
              <>
                <Header />
                Home
              </>
            }
          />
        </Routes>
      </Body>
      <Footer />
    </Container>
  );
};
