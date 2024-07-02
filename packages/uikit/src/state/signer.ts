import { useMutation, useQueryClient } from '@tanstack/react-query';
import { walletStateFromSignerQr } from '@tonkeeper/core/dist/service/walletService';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../hooks/appContext';
import { useAppSdk } from '../hooks/appSdk';
import { QueryKey } from '../libs/queryKey';
import { AppRoute } from '../libs/routes';
import { useWalletsStorage } from '../hooks/useStorage';

export const usePairSignerMutation = () => {
    const sdk = useAppSdk();
    const walletsStorage = useWalletsStorage();
    const { api } = useAppContext();
    const client = useQueryClient();
    const navigate = useNavigate();
    return useMutation<void, Error, string>(async qrCode => {
        try {
            const state = await walletStateFromSignerQr(api, qrCode);

            await walletsStorage.addWalletToState(state);

            await client.invalidateQueries([QueryKey.account]);

            navigate(AppRoute.home);
        } catch (e) {
            if (e instanceof Error) sdk.alert(e.message);
            throw e;
        }
    });
};
