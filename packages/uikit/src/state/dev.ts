import { useAppSdk } from '../hooks/appSdk';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import {
    DevSettings,
    getDevSettings,
    setDevSettings
} from '@tonkeeper/core/dist/service/devStorage';

export const useDevSettings = () => {
    const sdk = useAppSdk();
    return useQuery(
        [AppKey.DEV_SETTINGS],
        async () => {
            return getDevSettings(sdk.storage);
        },
        {
            keepPreviousData: true
        }
    );
};

export const useMutateDevSettings = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    return useMutation<void, Error, Partial<DevSettings>>(async devSettings => {
        await setDevSettings(sdk.storage, devSettings);
        await client.invalidateQueries([AppKey.DEV_SETTINGS]);
    });
};

export const useDevMenuVisibility = () => {
    const sdk = useAppSdk();

    return useQuery([AppKey.IS_DEV_MENU_VISIBLE], async () =>
        Boolean(await sdk.storage.get(AppKey.IS_DEV_MENU_VISIBLE))
    );
};

export const useMutateDevMenuVisibility = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();

    return useMutation(async () => {
        await sdk.storage.set(AppKey.IS_DEV_MENU_VISIBLE, true);

        await client.invalidateQueries([AppKey.IS_DEV_MENU_VISIBLE]);
    });
};
