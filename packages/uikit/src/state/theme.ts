import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { Theme, userDefaultTheme } from '@tonkeeper/core/dist/entries/theme';
import { useAppSdk } from '../hooks/appSdk';

export const useUserTheme = () => {
    const sdk = useAppSdk();
    return useQuery([AppKey.THEME], async () => {
        const theme = await sdk.storage.get<Theme>(AppKey.THEME);
        return theme ?? userDefaultTheme;
    });
};

export const useUserThemes = (account = 'account') => {
    return useQuery([AppKey.THEME, account], async () => {
        const items: Theme[] = [
            userDefaultTheme,
            {
                name: 'dev',
                color: 'green'
            }
        ];
        return items;
    });
};

export const useMutateTheme = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    return useMutation<void, Error, Theme>(async theme => {
        await sdk.storage.set(AppKey.THEME, theme);
        await client.invalidateQueries([AppKey.THEME]);
    });
};

export interface UIPreferences {
    asideWidth: number;
    showTokensChart: boolean;
}

export const useUserUIPreferences = () => {
    const sdk = useAppSdk();
    return useQuery([AppKey.UI_PREFERENCES], () => {
        return sdk.storage.get<Partial<UIPreferences>>(AppKey.UI_PREFERENCES);
    });
};

export const useMutateUserUIPreferences = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    return useMutation<void, Error, Partial<UIPreferences>>(async preferences => {
        const current = await sdk.storage.get<UIPreferences>(AppKey.UI_PREFERENCES);
        await sdk.storage.set(AppKey.UI_PREFERENCES, { ...current, ...preferences });
        await client.invalidateQueries([AppKey.UI_PREFERENCES]);
    });
};
