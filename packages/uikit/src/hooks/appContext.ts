import { APIConfig } from '@tonkeeper/core/dist/entries/apis';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
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
    fiat: FiatCurrencies;
    config: TonendpointConfig;
    tonendpoint: Tonendpoint;
    standalone: boolean;
    extension: boolean;
    ios: boolean;
    proFeatures: boolean;
    experimental?: boolean;
    hideQrScanner?: boolean;
    hideSigner?: boolean;
    hideKeystone?: boolean;
    hideLedger?: boolean;
    hideBrowser?: boolean;
    env?: {
        tgAuthBotId: string;
        stonfiReferralAddress: string;
    };
}

export const AppContext = React.createContext<IAppContext>({
    api: {
        tonApiV2: new ConfigurationV2(),
        tronApi: new TronConfiguration()
    },
    fiat: FiatCurrencies.USD,
    config: defaultTonendpointConfig,
    tonendpoint: new Tonendpoint({ targetEnv: 'web' }, {}),
    standalone: false,
    extension: false,
    ios: false,
    proFeatures: false,
    hideQrScanner: false
});

export const useAppContext = () => {
    return useContext(AppContext);
};

export const AppSelectionContext = React.createContext<EventTarget | null>(null);
