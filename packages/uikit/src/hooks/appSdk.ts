import { IAppSdk, MockAppSdk } from '@tonkeeper/core/dist/AppSdk';
import React, { useContext } from 'react';

export const AppSdkContext = React.createContext<IAppSdk>(new MockAppSdk());

export const useAppSdk = () => {
    return useContext(AppSdkContext);
};

export const useAppTargetEnv = () => {
    const sdk = useAppSdk();
    return sdk.targetEnv;
};
