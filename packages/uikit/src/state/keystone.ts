import UR from '@ngraveio/bc-ur/dist/ur';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { walletStateFromKeystone } from '@tonkeeper/core/dist/service/walletService';
import { useNavigate } from 'react-router-dom';
import { useAppSdk } from '../hooks/appSdk';
import { QueryKey } from '../libs/queryKey';
import { AppRoute } from '../libs/routes';
import { useWalletsStorage } from '../hooks/useStorage';
import { isStandardTonWallet } from '@tonkeeper/core/dist/entries/wallet';
import { useActiveWallet } from './wallet';

export const usePairKeystoneMutation = () => {
    const sdk = useAppSdk();
    const walletsStorage = useWalletsStorage();
    const navigate = useNavigate();
    const client = useQueryClient();

    return useMutation<void, Error, UR>(async ur => {
        try {
            const state = await walletStateFromKeystone(ur);
            const duplicatedWallet = await walletsStorage.getWallet(state.id);
            if (duplicatedWallet) {
                throw new Error('Wallet already exist');
            }

            await walletsStorage.addWalletToState(state);

            await client.invalidateQueries([QueryKey.account]);

            navigate(AppRoute.home);
        } catch (e) {
            if (e instanceof Error) sdk.alert(e.message);
            throw e;
        }
    });
};

export const useIsActiveWalletKeystone = () => {
    const wallet = useActiveWallet();
    return isStandardTonWallet(wallet) && wallet.auth.kind === 'keystone';
};
