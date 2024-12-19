import { APIConfig } from '@tonkeeper/core/dist/entries/apis';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { WalletVersion } from '@tonkeeper/core/dist/entries/wallet';
import { Configuration as ConfigurationV2 } from '@tonkeeper/core/dist/tonApiV2';
import {
    defaultTonendpointConfig,
    Tonendpoint,
    TonendpointConfig
} from '@tonkeeper/core/dist/tonkeeperApi/tonendpoint';
import { Configuration as TronConfiguration } from '@tonkeeper/core/dist/tronApi';
import React, { useContext } from 'react';

export interface IAppContext {
    mainnetApi: APIConfig;
    testnetApi: APIConfig;

    fiat: FiatCurrencies;
    mainnetConfig: TonendpointConfig;
    testnetConfig: TonendpointConfig;
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
    hideMam?: boolean;
    hideMultisig?: boolean;
    hideBrowser?: boolean;
    browserLength?: number;
    env?: {
        tgAuthBotId: string;
        stonfiReferralAddress: string;
    };
    defaultWalletVersion: WalletVersion;
}

export const AppContext = React.createContext<IAppContext>({
    mainnetApi: {
        tonApiV2: new ConfigurationV2(),
        tronApi: new TronConfiguration()
    },
    testnetApi: {
        tonApiV2: new ConfigurationV2(),
        tronApi: new TronConfiguration()
    },
    fiat: FiatCurrencies.USD,
    mainnetConfig: defaultTonendpointConfig,
    testnetConfig: defaultTonendpointConfig,
    tonendpoint: new Tonendpoint({ targetEnv: 'web' }, {}),
    standalone: false,
    extension: false,
    ios: false,
    proFeatures: false,
    hideQrScanner: false,
    defaultWalletVersion: WalletVersion.V5R1
});

export const useAppContext = () => {
    return useContext(AppContext);
};

export const AppSelectionContext = React.createContext<EventTarget | null>(null);

export const useAppPlatform = () => {
    const { tonendpoint } = useAppContext();
    return tonendpoint.targetEnv;
};
