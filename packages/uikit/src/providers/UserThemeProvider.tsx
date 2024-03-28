import { FC, PropsWithChildren, useEffect, useMemo } from 'react';
import { DefaultTheme, ThemeProvider } from 'styled-components';
import { availableThemes, useMutateUserUIPreferences, useUserUIPreferences } from '../state/theme';
import { usePrevious } from '../hooks/usePrevious';

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
    PropsWithChildren<{
        displayType?: 'compact' | 'full-width';
        isPro?: boolean;
        isProSupported?: boolean;
    }>
> = ({ children, displayType, isPro, isProSupported }) => {
    const { data: uiPreferences, isFetched: isUIPreferencesLoaded } = useUserUIPreferences();
    const { mutateAsync } = useMutateUserUIPreferences();
    const isProPrev = usePrevious(isPro);

    const [currentTheme, currentThemeName] = useMemo(() => {
        let themeName = uiPreferences?.theme;

        if (themeName === 'pro' && isPro === false) {
            themeName = 'dark';
        }

        if (!themeName && isPro) {
            themeName = 'pro';
        }

        if (isProPrev === false && isPro) {
            themeName = 'pro';
        }

        themeName = themeName || 'dark';

        let theme = availableThemes[themeName];

        if (displayType) {
            theme.displayType = displayType;
        }

        window.document.body.style.background = theme.backgroundPage;

        if (displayType === 'full-width') {
            theme = makeHalfCorner(theme);
        }

        return [theme, themeName];
    }, [uiPreferences?.theme, displayType, isPro, isProPrev]);

    useEffect(() => {
        if (currentTheme && uiPreferences && currentThemeName !== uiPreferences.theme) {
            mutateAsync({ theme: currentThemeName as 'dark' | 'pro' });
        }
    }, [mutateAsync, currentThemeName, uiPreferences]);

    if (!isUIPreferencesLoaded || (isPro === undefined && isProSupported)) {
        return <div></div>;
    }

    return <ThemeProvider theme={currentTheme as DefaultTheme}>{children}</ThemeProvider>;
};
