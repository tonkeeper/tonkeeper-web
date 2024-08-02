import { useMutation, useQueryClient } from '@tanstack/react-query';
import { accountBySignerDeepLink } from '@tonkeeper/core/dist/service/walletService';
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loading } from '../../components/Loading';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { QueryKey } from '../../libs/queryKey';
import { AppRoute } from '../../libs/routes';
import { useAccountsStorage } from '../../hooks/useStorage';

const useAddWalletMutation = () => {
    const sdk = useAppSdk();
    const accountsStorage = useAccountsStorage();
    const client = useQueryClient();
    const context = useAppContext();
    const navigate = useNavigate();

    return useMutation<void, Error, { publicKey: string | null; name: string | null }>(
        async ({ publicKey, name }) => {
            if (publicKey === null) {
                sdk.topMessage('Missing public key');
            } else {
                const state = await accountBySignerDeepLink(context, sdk.storage, publicKey, name);
                await accountsStorage.addAccountToState(state);
                await client.invalidateQueries([QueryKey.account]);
            }
            navigate(AppRoute.home);
        }
    );
};

const SignerLinkPage = () => {
    const [searchParams] = useSearchParams();
    const { mutate } = useAddWalletMutation();

    useEffect(() => {
        const publicKey = searchParams.get('pk');
        const name = searchParams.get('name');
        mutate({ publicKey, name });
    }, [searchParams]);

    return <Loading />;
};

export default SignerLinkPage;
