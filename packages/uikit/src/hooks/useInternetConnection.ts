import { useAppSdk } from './appSdk';
import { useAtomValue } from '../libs/useAtom';

export const useInternetConnection = () => {
    const sdk = useAppSdk();
    const isConnected = useAtomValue(sdk.connectionService.isOnline);

    return {
        isConnected,
        retry: sdk.connectionService.retry
    };
};
