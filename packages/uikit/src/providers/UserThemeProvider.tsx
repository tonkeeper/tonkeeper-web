import { FC, PropsWithChildren, useEffect, useMemo } from 'react';
import { DefaultTheme, ThemeProvider } from 'styled-components';
import { availableThemes, useMutateUserUIPreferences, useUserUIPreferences } from '../state/theme';
import { usePrevious } from '../hooks/usePrevious';
import { getUserOS } from '../libs/web';
export const UserThemeProvider: FC<
    PropsWithChildren<{
        displayType?: 'compact' | 'full-width';
        isPro?: boolean;
        isProSupported?: boolean;
        isInsideTonkeeper?: boolean;
        proDisplayType?: 'mobile' | 'desktop';
    }>
> = ({ children, displayType, isPro, isProSupported, isInsideTonkeeper, proDisplayType }) => {
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

        if (displayType === 'full-width' && proDisplayType) {
            theme.proDisplayType = proDisplayType;
        }

        theme.os = getUserOS();

        window.document.body.style.background = theme.backgroundPage;

        if (isInsideTonkeeper) {
            theme = {
                ...theme,
                corner3xSmall: '2px',
                corner2xSmall: '4px',
                cornerExtraSmall: '6px',
                cornerSmall: '8px',
                cornerMedium: '12px',
                cornerLarge: '16px',
                cornerFull: '100%'
            };
        }

        return [theme, themeName];
    }, [uiPreferences?.theme, displayType, isPro, isProPrev, isInsideTonkeeper, proDisplayType]);

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
