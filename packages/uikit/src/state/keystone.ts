import { UR } from '@keystonehq/keystone-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addWalletWithCustomAuthState } from '@tonkeeper/core/dist/service/accountService';
import { walletStateFromKeystone } from '@tonkeeper/core/dist/service/walletService';
import { useNavigate } from 'react-router-dom';
import { useAppSdk } from '../hooks/appSdk';
import { QueryKey } from '../libs/queryKey';
import { AppRoute } from '../libs/routes';

export const usePairKeystoneMutation = () => {
    const sdk = useAppSdk();
    const navigate = useNavigate();
    const client = useQueryClient();

    return useMutation<void, Error, UR>(async ur => {
        try {
            const state = await walletStateFromKeystone(ur);

            await addWalletWithCustomAuthState(sdk.storage, state);

            await client.invalidateQueries([QueryKey.account]);

            navigate(AppRoute.home);
        } catch (e) {
            if (e instanceof Error) sdk.alert(e.message);
            throw e;
        }
    });
};
