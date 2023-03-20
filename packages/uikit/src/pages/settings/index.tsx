import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { InnerBody } from '../../components/Body';
import { SettingsHeader } from '../../components/Header';
import { SettingsRoute } from '../../libs/routes';
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
          <InnerBody>
            <Localization />
          </InnerBody>
        }
      />
      <Route
        path={SettingsRoute.legal}
        element={
          <InnerBody>
            <Legal />
          </InnerBody>
        }
      />
      <Route
        path={SettingsRoute.theme}
        element={
          <InnerBody>
            <UserTheme />
          </InnerBody>
        }
      />
      <Route
        path={SettingsRoute.dev}
        element={
          <InnerBody>
            <DevSettings />
          </InnerBody>
        }
      />
      <Route
        path={SettingsRoute.fiat}
        element={
          <InnerBody>
            <FiatCurrency />
          </InnerBody>
        }
      />
      <Route
        path={SettingsRoute.account}
        element={
          <InnerBody>
            <Account />
          </InnerBody>
        }
      />
      <Route path={SettingsRoute.recovery}>
        <Route path=":publicKey" element={<Recovery />} />
        <Route index element={<ActiveRecovery />} />
      </Route>
      <Route
        path={SettingsRoute.version}
        element={
          <InnerBody>
            <WalletVersion />
          </InnerBody>
        }
      />
      <Route
        path={SettingsRoute.jettons}
        element={
          <InnerBody>
            <JettonsSettings />
          </InnerBody>
        }
      />
      <Route
        path={SettingsRoute.security}
        element={
          <InnerBody>
            <SecuritySettings />
          </InnerBody>
        }
      />
      <Route
        path="*"
        element={
          <>
            <SettingsHeader />
            <InnerBody>
              <Settings />
            </InnerBody>
          </>
        }
      />
    </Routes>
  );
};

export default SettingsRouter;
