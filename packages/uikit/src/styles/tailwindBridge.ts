import { DefaultTheme } from 'styled-components';

/**
 * Maps each styled-components theme key onto the CSS custom property
 * declared in `tailwind.css`. Two consumers depend on this table:
 *
 *  1. `UserThemeProvider` calls `syncThemeToTailwindVars(theme)` whenever
 *     the active theme changes, rewriting these properties on `:root`.
 *  2. `tailwind.config.ts`'s `theme.extend.colors` / `.borderRadius` blocks
 *     reference the same CSS variable names.
 *
 * Adding a new bridged token: append it here, declare a fallback in
 * `tailwind.css` `:root`, and add the matching Tailwind color/radius entry.
 */
type BridgedKey = Extract<
    keyof DefaultTheme,
    // colors
    | 'textPrimary'
    | 'textSecondary'
    | 'textTertiary'
    | 'textAccent'
    | 'textPrimaryAlternate'
    | 'backgroundPage'
    | 'backgroundTransparent'
    | 'backgroundContent'
    | 'backgroundContentTint'
    | 'backgroundContentAttention'
    | 'backgroundOverlayStrong'
    | 'backgroundOverlayLight'
    | 'backgroundOverlayExtraLight'
    | 'backgroundHighlighted'
    | 'iconPrimary'
    | 'iconSecondary'
    | 'iconTertiary'
    | 'iconPrimaryAlternate'
    | 'buttonPrimaryBackground'
    | 'buttonPrimaryForeground'
    | 'buttonSecondaryBackground'
    | 'buttonSecondaryForeground'
    | 'buttonTertiaryBackground'
    | 'buttonTertiaryForeground'
    | 'buttonWarnBackground'
    | 'buttonWarnForeground'
    | 'buttonPrimaryBackgroundDisabled'
    | 'buttonSecondaryBackgroundDisabled'
    | 'buttonTertiaryBackgroundDisabled'
    | 'buttonWarnBackgroundDisabled'
    | 'buttonPrimaryForegroundDisabled'
    | 'buttonSecondaryForegroundDisabled'
    | 'buttonTertiaryForegroundDisabled'
    | 'buttonWarnForegroundDisabled'
    | 'buttonPrimaryBackgroundHighlighted'
    | 'buttonSecondaryBackgroundHighlighted'
    | 'buttonTertiaryBackgroundHighlighted'
    | 'buttonWarnBackgroundHighlighted'
    | 'fieldBackground'
    | 'fieldActiveBorder'
    | 'fieldErrorBorder'
    | 'fieldErrorBackground'
    | 'accentBlue'
    | 'accentBlueConstant'
    | 'accentGreen'
    | 'accentRed'
    | 'accentOrange'
    | 'accentPurple'
    | 'tabBarActiveIcon'
    | 'tabBarInactiveIcon'
    | 'separatorCommon'
    | 'separatorAlternate'
    | 'constantBlack'
    | 'constantWhite'
    | 'blue'
    | 'red'
    // corners
    | 'corner3xSmall'
    | 'corner2xSmall'
    | 'cornerExtraSmall'
    | 'cornerSmall'
    | 'cornerMedium'
    | 'cornerLarge'
    | 'cornerFull'
>;

const BRIDGE: Record<BridgedKey, string> = {
    textPrimary: '--tk-text-primary',
    textSecondary: '--tk-text-secondary',
    textTertiary: '--tk-text-tertiary',
    textAccent: '--tk-text-accent',
    textPrimaryAlternate: '--tk-text-primary-alternate',

    backgroundPage: '--tk-background-page',
    backgroundTransparent: '--tk-background-transparent',
    backgroundContent: '--tk-background-content',
    backgroundContentTint: '--tk-background-content-tint',
    backgroundContentAttention: '--tk-background-content-attention',
    backgroundOverlayStrong: '--tk-background-overlay-strong',
    backgroundOverlayLight: '--tk-background-overlay-light',
    backgroundOverlayExtraLight: '--tk-background-overlay-extra-light',
    backgroundHighlighted: '--tk-background-highlighted',

    iconPrimary: '--tk-icon-primary',
    iconSecondary: '--tk-icon-secondary',
    iconTertiary: '--tk-icon-tertiary',
    iconPrimaryAlternate: '--tk-icon-primary-alternate',

    buttonPrimaryBackground: '--tk-button-primary-background',
    buttonPrimaryForeground: '--tk-button-primary-foreground',
    buttonSecondaryBackground: '--tk-button-secondary-background',
    buttonSecondaryForeground: '--tk-button-secondary-foreground',
    buttonTertiaryBackground: '--tk-button-tertiary-background',
    buttonTertiaryForeground: '--tk-button-tertiary-foreground',
    buttonWarnBackground: '--tk-button-warn-background',
    buttonWarnForeground: '--tk-button-warn-foreground',
    buttonPrimaryBackgroundDisabled: '--tk-button-primary-background-disabled',
    buttonSecondaryBackgroundDisabled: '--tk-button-secondary-background-disabled',
    buttonTertiaryBackgroundDisabled: '--tk-button-tertiary-background-disabled',
    buttonWarnBackgroundDisabled: '--tk-button-warn-background-disabled',
    buttonPrimaryForegroundDisabled: '--tk-button-primary-foreground-disabled',
    buttonSecondaryForegroundDisabled: '--tk-button-secondary-foreground-disabled',
    buttonTertiaryForegroundDisabled: '--tk-button-tertiary-foreground-disabled',
    buttonWarnForegroundDisabled: '--tk-button-warn-foreground-disabled',
    buttonPrimaryBackgroundHighlighted: '--tk-button-primary-background-highlighted',
    buttonSecondaryBackgroundHighlighted: '--tk-button-secondary-background-highlighted',
    buttonTertiaryBackgroundHighlighted: '--tk-button-tertiary-background-highlighted',
    buttonWarnBackgroundHighlighted: '--tk-button-warn-background-highlighted',

    fieldBackground: '--tk-field-background',
    fieldActiveBorder: '--tk-field-active-border',
    fieldErrorBorder: '--tk-field-error-border',
    fieldErrorBackground: '--tk-field-error-background',

    accentBlue: '--tk-accent-blue',
    accentBlueConstant: '--tk-accent-blue-constant',
    accentGreen: '--tk-accent-green',
    accentRed: '--tk-accent-red',
    accentOrange: '--tk-accent-orange',
    accentPurple: '--tk-accent-purple',

    tabBarActiveIcon: '--tk-tabbar-active-icon',
    tabBarInactiveIcon: '--tk-tabbar-inactive-icon',

    separatorCommon: '--tk-separator-common',
    separatorAlternate: '--tk-separator-alternate',

    constantBlack: '--tk-constant-black',
    constantWhite: '--tk-constant-white',
    blue: '--tk-blue',
    red: '--tk-red',

    corner3xSmall: '--tk-corner-3xsmall',
    corner2xSmall: '--tk-corner-2xsmall',
    cornerExtraSmall: '--tk-corner-extra-small',
    cornerSmall: '--tk-corner-small',
    cornerMedium: '--tk-corner-medium',
    cornerLarge: '--tk-corner-large',
    cornerFull: '--tk-corner-full'
};

const BRIDGED_KEYS = Object.keys(BRIDGE) as BridgedKey[];

export const syncThemeToTailwindVars = (theme: DefaultTheme): void => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    for (const key of BRIDGED_KEYS) {
        const value = theme[key];
        if (typeof value === 'string') {
            root.style.setProperty(BRIDGE[key], value);
        }
    }
};
