import { userDefaultTheme } from '@tonkeeper/core/dist/entries/theme';
import { FC, PropsWithChildren, useMemo } from 'react';
import { DefaultTheme, ThemeProvider } from 'styled-components';
import { useUserTheme } from '../state/theme';
import { defaultTheme } from '../styles/defaultTheme';
import { lightTheme } from '../styles/lightTheme';
import { proTheme } from '../styles/proTheme';

const makeHalfCorner = (theme: DefaultTheme): DefaultTheme => {
    return Object.entries(theme)
        .map(
            ([key, value]: [string, string]) =>
                [key, key.startsWith('corner') ? `${parseInt(value) / 2}px` : value] as const
        )
        .reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
        }, {} as Record<string, string>) as DefaultTheme;
};

export const UserThemeProvider: FC<
    PropsWithChildren<{ isDark?: boolean; displayType?: 'compact' | 'full-width'; isPro?: boolean }>
> = ({ children, isDark = true, displayType, isPro }) => {
    const { data, isFetched } = useUserTheme();

    const currentTheme = useMemo(() => {
        let theme = isPro ? proTheme : isDark ? defaultTheme : lightTheme;

        if (displayType) {
            theme.displayType = displayType;
        }

        window.document.body.style.background = theme.backgroundPage;

        if (displayType === 'full-width') {
            theme = makeHalfCorner(theme);
        }

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
    }, [data, isDark, displayType, isPro]);

    if (!isFetched) {
        return <div></div>;
    }

    return <ThemeProvider theme={currentTheme as DefaultTheme}>{children}</ThemeProvider>;
};
