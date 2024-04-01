import { IAppSdk, MockAppSdk } from '@tonkeeper/core/dist/AppSdk';
import React, { useContext, useEffect } from 'react';

export const AppSdkContext = React.createContext<IAppSdk>(new MockAppSdk());

export const useAppSdk = () => {
    return useContext(AppSdkContext);
};

export function useToast() {
    const sdk = useAppSdk();
    return (content: string) => {
        sdk.topMessage(content);
    };
}

export function useNotifyError(error: unknown) {
    const sdk = useAppSdk();
    useEffect(() => {
        if (error instanceof Error) {
            sdk.topMessage(error.message);
        }
    }, [error]);
}

export const OnImportAction = React.createContext<(path: string) => void>(console.log);

export const useOnImportAction = () => {
    return useContext(OnImportAction);
};

export const AfterImportAction = React.createContext<() => void>(console.log);

export const useAfterImportAction = () => {
    return useContext(AfterImportAction);
};
