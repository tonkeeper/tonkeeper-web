import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { SettingsHeader } from '../../components/Header';
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
  return (
    <Routes>
      <Route
        path={SettingsRoute.localization}
        element={
          <Body>
            <Localization />
          </Body>
        }
      />
      <Route
        path={SettingsRoute.legal}
        element={
          <Body>
            <Legal />
          </Body>
        }
      />
      <Route
        path={SettingsRoute.theme}
        element={
          <Body>
            <UserTheme />
          </Body>
        }
      />
      <Route
        path={SettingsRoute.dev}
        element={
          <Body>
            <DevSettings />
          </Body>
        }
      />
      <Route
        path={SettingsRoute.fiat}
        element={
          <Body>
            <FiatCurrency />
          </Body>
        }
      />
      <Route
        path={SettingsRoute.account}
        element={
          <Body>
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
          <Body>
            <WalletVersion />
          </Body>
        }
      />
      <Route
        path={SettingsRoute.jettons}
        element={
          <Body>
            <JettonsSettings />
          </Body>
        }
      />
      <Route
        path={SettingsRoute.security}
        element={
          <Body>
            <SecuritySettings />
          </Body>
        }
      />
      <Route
        path="*"
        element={
          <>
            <SettingsHeader />
            <Body>
              <Settings />
            </Body>
          </>
        }
      />
    </Routes>
  );
};

export default SettingsRouter;
