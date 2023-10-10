import { AccountState, defaultAccountState } from '@tonkeeper/core/dist/entries/account';
import { APIConfig } from '@tonkeeper/core/dist/entries/apis';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { AuthState, defaultAuthState } from '@tonkeeper/core/dist/entries/password';
import { WalletState } from '@tonkeeper/core/dist/entries/wallet';
import { Configuration as ConfigurationV2 } from '@tonkeeper/core/dist/tonApiV2';
import {
    Tonendpoint,
    TonendpointConfig,
    defaultTonendpointConfig
} from '@tonkeeper/core/dist/tonkeeperApi/tonendpoint';
import { Configuration as TronConfiguration } from '@tonkeeper/core/dist/tronApi';
import React, { useContext } from 'react';

export interface IAppContext {
    api: APIConfig;
    account: AccountState;
    auth: AuthState;
    fiat: FiatCurrencies;
    config: TonendpointConfig;
    tonendpoint: Tonendpoint;
    standalone: boolean;
    extension: boolean;
    ios: boolean;
    hideQrScanner?: boolean;
}

export const AppContext = React.createContext<IAppContext>({
    api: {
        tonApiV2: new ConfigurationV2(),
        tronApi: new TronConfiguration()
    },
    account: defaultAccountState,
    auth: defaultAuthState,
    fiat: FiatCurrencies.USD,
    config: defaultTonendpointConfig,
    tonendpoint: new Tonendpoint({}, {}),
    standalone: false,
    extension: false,
    ios: false,
    hideQrScanner: false
});

export const useAppContext = () => {
    return useContext(AppContext);
};

export const WalletStateContext = React.createContext<WalletState>(undefined!);

export const useWalletContext = () => {
    return useContext(WalletStateContext);
};

export const AppSelectionContext = React.createContext<EventTarget | null>(null);
