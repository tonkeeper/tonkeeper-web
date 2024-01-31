import { useMutation, useQuery } from '@tanstack/react-query';
import { ProState } from '@tonkeeper/core/dist/entries/pro';
import { getProState } from '@tonkeeper/core/dist/service/proService';
import { useWalletContext } from '../hooks/appContext';
import { useAppSdk } from '../hooks/appSdk';
import { QueryKey } from '../libs/queryKey';

export const useProState = () => {
    const sdk = useAppSdk();
    const wallet = useWalletContext();
    return useQuery<ProState, Error>([QueryKey.pro], () => getProState(sdk.storage, wallet));
};

export const useSelectWalletMutation = () => {
    return useMutation(async () => {});
};
