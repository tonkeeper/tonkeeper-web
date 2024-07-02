import { walletsStorage } from '@tonkeeper/core/dist/service/walletsService';
import { useAppSdk } from './appSdk';
import { passwordStorage } from '@tonkeeper/core/dist/service/passwordService';

export const useWalletsStorage = () => {
    const sdk = useAppSdk();
    return walletsStorage(sdk.storage);
};

export const usePasswordStorage = () => {
    const sdk = useAppSdk();
    return passwordStorage(sdk.storage);
};
