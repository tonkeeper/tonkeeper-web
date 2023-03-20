import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { SettingsHeader } from '../../components/Header';
import { useAppContext } from '../../hooks/appContext';
import { SettingsRoute } from '../../libs/routes';
import { Body } from '../../styles/globalStyle';
import { Account } from './Account';
import { DevSettings } from './Dev';
import { FiatCurrency } from './FiatCurrency';
import { JettonsSettings } from './Jettons';
import { Legal } from './Legal';
import { Localization } from './Localization';
import { ActiveRecovery, Recovery } from './Recovery';
import { SecuritySettings } from './Security';
import { Settings } from './Settings';
import { UserTheme } from './Theme';
import { WalletVersion } from './Version';

const SettingsRouter = () => {
  const { standalone } = useAppContext();
  return (
    <Routes>
      <Route
        path={SettingsRoute.localization}
        element={
          <Body standalone={standalone}>
            <Localization />
          </Body>
        }
      />
      <Route
        path={SettingsRoute.legal}
        element={
          <Body standalone={standalone}>
            <Legal />
          </Body>
        }
      />
      <Route
        path={SettingsRoute.theme}
        element={
          <Body standalone={standalone}>
            <UserTheme />
          </Body>
        }
      />
      <Route
        path={SettingsRoute.dev}
        element={
          <Body standalone={standalone}>
            <DevSettings />
          </Body>
        }
      />
      <Route
        path={SettingsRoute.fiat}
        element={
          <Body standalone={standalone}>
            <FiatCurrency />
          </Body>
        }
      />
      <Route
        path={SettingsRoute.account}
        element={
          <Body standalone={standalone}>
            <Account />
          </Body>
        }
      />
      <Route path={SettingsRoute.recovery}>
        <Route path=":publicKey" element={<Recovery />} />
        <Route index element={<ActiveRecovery />} />
      </Route>
      <Route
        path={SettingsRoute.version}
        element={
          <Body standalone={standalone}>
            <WalletVersion />
          </Body>
        }
      />
      <Route
        path={SettingsRoute.jettons}
        element={
          <Body standalone={standalone}>
            <JettonsSettings />
          </Body>
        }
      />
      <Route
        path={SettingsRoute.security}
        element={
          <Body standalone={standalone}>
            <SecuritySettings />
          </Body>
        }
      />
      <Route
        path="*"
        element={
          <>
            <SettingsHeader />
            <Body standalone={standalone}>
              <Settings />
            </Body>
          </>
        }
      />
    </Routes>
  );
};

export default SettingsRouter;
