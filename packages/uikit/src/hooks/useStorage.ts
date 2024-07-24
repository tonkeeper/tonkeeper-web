import { useAppSdk } from './appSdk';
import { passwordStorage } from '@tonkeeper/core/dist/service/passwordService';
import { accountsStorage } from '@tonkeeper/core/dist/service/accountsStorage';

export const useAccountsStorage = () => {
    const sdk = useAppSdk();
    return accountsStorage(sdk.storage);
};

export const usePasswordStorage = () => {
    const sdk = useAppSdk();
    return passwordStorage(sdk.storage);
};
