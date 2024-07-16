import { useAppSdk } from '../hooks/appSdk';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { UIPreferences } from './theme';

export interface DevSettings {
    enableV5: boolean;
}

const defaultDevSettings: DevSettings = {
    enableV5: false
};

export const useDevSettings = () => {
    const sdk = useAppSdk();
    return useQuery(
        [AppKey.DEV_SETTINGS],
        async () => {
            const settings = await sdk.storage.get<DevSettings>(AppKey.DEV_SETTINGS);
            return {
                ...defaultDevSettings,
                ...settings
            };
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
        const current = await sdk.storage.get<UIPreferences>(AppKey.DEV_SETTINGS);
        await sdk.storage.set(AppKey.DEV_SETTINGS, { ...devSettings, ...current, ...devSettings });
        await client.invalidateQueries([AppKey.DEV_SETTINGS]);
    });
};
