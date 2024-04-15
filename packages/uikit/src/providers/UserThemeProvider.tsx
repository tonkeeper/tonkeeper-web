import { FC, PropsWithChildren, useMemo } from 'react';
import { DefaultTheme, ThemeProvider } from 'styled-components';
import { availableThemes, useUserUIPreferences } from '../state/theme';

export const UserThemeProvider: FC<
    PropsWithChildren<{
        displayType?: 'compact' | 'full-width';
        isPro?: boolean;
        isProSupported?: boolean;
    }>
> = ({ children, displayType, isPro }) => {
    const { data: uiPreferences } = useUserUIPreferences();

    const [currentTheme, _currentThemeName] = useMemo(() => {
        let themeName: 'dark' | 'pro' = 'dark';
        let theme = availableThemes[themeName];

        if (isPro === true) {
            themeName = (uiPreferences?.theme || 'pro') as 'dark' | 'pro';
            theme = availableThemes[themeName];
        }

        if (displayType) {
            theme.displayType = displayType;
        }

        window.document.body.style.background = theme.backgroundPage;

        return [theme, themeName];
    }, [uiPreferences?.theme, displayType, isPro]);

    return <ThemeProvider theme={currentTheme as DefaultTheme}>{children}</ThemeProvider>;
};
