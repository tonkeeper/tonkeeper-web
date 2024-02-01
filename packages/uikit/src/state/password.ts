import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { AuthState, defaultAuthState } from '@tonkeeper/core/dist/entries/password';
import { useAppSdk } from '../hooks/appSdk';
import { QueryKey } from '../libs/queryKey';

export const useAuthState = () => {
    const sdk = useAppSdk();
    return useQuery([QueryKey.password], async () => {
        const auth = await sdk.storage.get<AuthState>(AppKey.GLOBAL_AUTH_STATE);
        return auth ?? defaultAuthState;
    });
};

export const useLookScreen = () => {
    const sdk = useAppSdk();
    return useQuery([QueryKey.lock], async () => {
        const lock = await sdk.storage.get<boolean>(AppKey.LOCK);
        return lock ?? false;
    });
};

export const useMutateLookScreen = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    return useMutation<void, Error, boolean>(async value => {
        await sdk.storage.set(AppKey.LOCK, value);
        await client.invalidateQueries([QueryKey.lock]);
    });
};
