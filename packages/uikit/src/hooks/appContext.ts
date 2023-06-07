import {
  AccountState,
  defaultAccountState,
} from '@tonkeeper/core/dist/entries/account';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import {
  AuthState,
  defaultAuthState,
} from '@tonkeeper/core/dist/entries/password';
import { WalletState } from '@tonkeeper/core/dist/entries/wallet';
import { Configuration } from '@tonkeeper/core/dist/tonApiV1';
import {
  defaultTonendpointConfig,
  Tonendpoint,
  TonendpointConfig,
} from '@tonkeeper/core/dist/tonkeeperApi/tonendpoint';
import React, { useContext } from 'react';

export const AppContext = React.createContext<{
  tonApi: Configuration;
  account: AccountState;
  auth: AuthState;
  fiat: FiatCurrencies;
  config: TonendpointConfig;
  tonendpoint: Tonendpoint;
  standalone: boolean;
  extension: boolean;
  ios: boolean;
}>({
  tonApi: new Configuration(),
  account: defaultAccountState,
  auth: defaultAuthState,
  fiat: FiatCurrencies.USD,
  config: defaultTonendpointConfig,
  tonendpoint: new Tonendpoint({}, {}),
  standalone: false,
  extension: false,
  ios: false,
});

export const useAppContext = () => {
  return useContext(AppContext);
};

export const WalletStateContext = React.createContext<WalletState>(undefined!);

export const useWalletContext = () => {
  return useContext(WalletStateContext);
};

export const AppSelectionContext = React.createContext<EventTarget | null>(
  null
);
