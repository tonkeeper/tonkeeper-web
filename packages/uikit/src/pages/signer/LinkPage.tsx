import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addWalletWithCustomAuthState } from '@tonkeeper/core/dist/service/accountService';
import { walletStateFromSignerDeepLink } from '@tonkeeper/core/dist/service/walletService';
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loading } from '../../components/Loading';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { QueryKey } from '../../libs/queryKey';
import { AppRoute } from '../../libs/routes';

const useAddWalletMutation = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    const { api } = useAppContext();
    const navigate = useNavigate();

    return useMutation<void, Error, { publicKey: string | null; name: string | null }>(
        async ({ publicKey, name }) => {
            if (publicKey === null) {
                sdk.topMessage('Missing public key');
            } else {
                const state = await walletStateFromSignerDeepLink(api, publicKey, name);
                await addWalletWithCustomAuthState(sdk.storage, state);
                await client.invalidateQueries([QueryKey.account]);
            }
            navigate(AppRoute.home);
        }
    );
};

const SignerLinkPage = () => {
    let [searchParams] = useSearchParams();
    const { mutate } = useAddWalletMutation();

    useEffect(() => {
        const publicKey = searchParams.get('pk');
        const name = searchParams.get('name');
        mutate({ publicKey, name });
    }, [searchParams]);

    return <Loading />;
};

export default SignerLinkPage;
