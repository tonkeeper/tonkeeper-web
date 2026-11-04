import { FC, PropsWithChildren, useEffect, useMemo } from 'react';
import { DefaultTheme, ThemeProvider } from 'styled-components';
import {
    useAvailableThemes,
    useMutateUserUIPreferences,
    useUserUIPreferences
} from '../state/theme';
import { usePrevious } from '../hooks/usePrevious';
import { getUserOS } from '../libs/web';
import { syncThemeToTailwindVars } from '../styles/tailwindBridge';
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
    const availableThemes = useAvailableThemes();

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

        // Clone so the per-render overrides below (displayType, proDisplayType,
        // os, isInsideTonkeeper corners) never mutate the shared
        // availableThemes[themeName] singleton. Mutating it caused a
        // viewport-resize bug: desktop→mobile left `proDisplayType` stuck on
        // `'desktop'` because the mobile branch doesn't touch the field, so
        // `Button` kept reading the desktop size.
        let theme: DefaultTheme = { ...availableThemes[themeName] };

        if (displayType) {
            theme.displayType = displayType;
        }

        // Always assign proDisplayType deterministically (never carry the
        // previous render's value via the shared object). Only the
        // `full-width` shell honors it; in `compact` mode the field is
        // intentionally cleared so Button falls back to `'large'`.
        theme.proDisplayType = displayType === 'full-width' ? proDisplayType : undefined;

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
    }, [
        uiPreferences?.theme,
        displayType,
        isPro,
        isProPrev,
        isInsideTonkeeper,
        proDisplayType,
        availableThemes
    ]);

    useEffect(() => {
        if (currentTheme && uiPreferences && currentThemeName !== uiPreferences.theme) {
            mutateAsync({ theme: currentThemeName as 'dark' | 'pro' });
        }
    }, [mutateAsync, currentThemeName, uiPreferences, currentTheme]);

    useEffect(() => {
        if (!currentTheme) return;
        // Mirror the active styled-components theme into the CSS custom
        // properties consumed by Tailwind utilities. `isInsideTonkeeper`
        // rewrites corner tokens, so the sync is not a no-op even when the
        // theme name stays the same.
        syncThemeToTailwindVars(currentTheme as DefaultTheme);
        document.documentElement.dataset.theme = currentThemeName;
    }, [currentTheme, currentThemeName]);

    if (!isUIPreferencesLoaded || (isPro === undefined && isProSupported)) {
        return <div></div>;
    }

    return <ThemeProvider theme={currentTheme as DefaultTheme}>{children}</ThemeProvider>;
};
