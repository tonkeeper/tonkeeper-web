import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { useAppSdk, useAppTargetEnv } from '../hooks/appSdk';
import { defaultTheme } from '../styles/defaultTheme';
import { proTheme } from '../styles/proTheme';
import { mobileProTheme } from '../styles/mobileProTheme';
import { useMemo } from 'react';

export const useAvailableThemes = () => {
    const env = useAppTargetEnv();

    return useMemo(() => {
        if (env === 'mobile') {
            return {
                dark: defaultTheme,
                pro: mobileProTheme
            };
        } else {
            return {
                dark: defaultTheme,
                pro: proTheme
            };
        }
    }, [env]);
};

export interface UIPreferences {
    asideWidth: number;
    showTokensChart: boolean;
    theme: 'dark' | 'pro';
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
