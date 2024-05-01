import { IAppSdk } from '@tonkeeper/core/dist/AppSdk';
import { useEffect } from 'react';

export const useNavigate = (sdk: IAppSdk, onNavigate: () => void) => {
    useEffect(() => {
        sdk.uiEvents.on('navigate', onNavigate);
        return () => {
            sdk.uiEvents.off('navigate', onNavigate);
        };
    }, [sdk, onNavigate]);
};
