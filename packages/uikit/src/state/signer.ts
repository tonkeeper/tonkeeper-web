import { useMutation, useQueryClient } from '@tanstack/react-query';
import { accountBySignerQr } from '@tonkeeper/core/dist/service/walletService';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../hooks/appContext';
import { useAppSdk } from '../hooks/appSdk';
import { QueryKey } from '../libs/queryKey';
import { AppRoute } from '../libs/routes';
import { useAccountsStorage } from '../hooks/useStorage';

export const usePairSignerMutation = () => {
    const sdk = useAppSdk();
    const accountsStorage = useAccountsStorage();
    const context = useAppContext();
    const client = useQueryClient();
    const navigate = useNavigate();
    return useMutation<void, Error, string>(async qrCode => {
        try {
            const newAccount = await accountBySignerQr(context, sdk.storage, qrCode);

            await accountsStorage.addAccountToState(newAccount);
            await accountsStorage.setActiveAccountId(newAccount.id);

            await client.invalidateQueries([QueryKey.account]);

            navigate(AppRoute.home);
        } catch (e) {
            if (e instanceof Error) sdk.alert(e.message);
            throw e;
        }
    });
};
