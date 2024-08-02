import UR from '@ngraveio/bc-ur/dist/ur';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { accountByKeystone } from '@tonkeeper/core/dist/service/walletService';
import { useNavigate } from 'react-router-dom';
import { useAppSdk } from '../hooks/appSdk';
import { QueryKey } from '../libs/queryKey';
import { AppRoute } from '../libs/routes';
import { useAccountsStorage } from '../hooks/useStorage';
import { useActiveAccount } from './wallet';

export const usePairKeystoneMutation = () => {
    const sdk = useAppSdk();
    const accountsStorage = useAccountsStorage();
    const navigate = useNavigate();
    const client = useQueryClient();

    return useMutation<void, Error, UR>(async ur => {
        try {
            const newAccount = await accountByKeystone(ur, sdk.storage);
            const duplicatedWallet = await accountsStorage.getAccount(newAccount.id);
            if (duplicatedWallet) {
                throw new Error('Wallet already exist');
            }

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

export const useIsActiveWalletKeystone = () => {
    const account = useActiveAccount();
    return account.type === 'keystone';
};
