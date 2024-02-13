import { userDefaultTheme } from '@tonkeeper/core/dist/entries/theme';
import React, { FC, PropsWithChildren, useMemo } from 'react';
import { DefaultTheme, ThemeProvider } from 'styled-components';
import { useUserTheme } from '../state/theme';
import { defaultTheme } from '../styles/defaultTheme';
import { lightTheme } from '../styles/lightTheme';

export const UserThemeProvider: FC<PropsWithChildren<{ isDark?: boolean }>> = ({
    children,
    isDark = true
}) => {
    const { data, isFetched } = useUserTheme();

    const currentTheme = useMemo(() => {
        const theme = isDark ? defaultTheme : lightTheme;

        if (!data || data.name === 'default') {
            return theme;
        } else {
            return Object.entries(theme)
                .map(
                    ([key, value]: [string, string]) =>
                        [key, value === userDefaultTheme.color ? data.color : value] as const
                )
                .reduce((acc, [key, value]) => {
                    acc[key] = value;
                    return acc;
                }, {} as Record<string, string>);
        }
    }, [data, isDark]);

    if (!isFetched) {
        return <div></div>;
    }

    return <ThemeProvider theme={currentTheme as DefaultTheme}>{children}</ThemeProvider>;
};
