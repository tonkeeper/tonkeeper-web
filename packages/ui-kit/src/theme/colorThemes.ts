/**
 * Colour themes of the design library: one palette per Figma variable mode
 * (Blue, Dark, Light). Keys are the Tailwind colour names from
 * `tailwind.config.ts`; `COLOR_TOKENS` lists them in the library's order with
 * their Figma names and the CSS custom properties Tailwind reads.
 */

export const COLOR_THEMES = ['blue', 'dark', 'light'] as const;
export type ColorThemeName = (typeof COLOR_THEMES)[number];

export const COLOR_TOKEN_GROUPS = [
    'Text',
    'Background',
    'Icon',
    'Button',
    'Field',
    'Accent',
    'TabBar',
    'Separator',
    'Constant & System'
] as const;
export type ColorTokenGroup = (typeof COLOR_TOKEN_GROUPS)[number];

export interface ColorTokenSpec {
    group: ColorTokenGroup;
    name: string;
    cssVar: string;
}

export const COLOR_TOKENS = {
    textPrimary: { group: 'Text', name: 'Primary', cssVar: '--tk-text-primary' },
    textSecondary: { group: 'Text', name: 'Secondary', cssVar: '--tk-text-secondary' },
    textTertiary: { group: 'Text', name: 'Tertiary', cssVar: '--tk-text-tertiary' },
    textAccent: { group: 'Text', name: 'Accent', cssVar: '--tk-text-accent' },
    textPrimaryAlternate: {
        group: 'Text',
        name: 'Primary Alternate',
        cssVar: '--tk-text-primary-alternate'
    },

    backgroundPage: { group: 'Background', name: 'Page', cssVar: '--tk-background-page' },
    backgroundTransparent: {
        group: 'Background',
        name: 'Transparent',
        cssVar: '--tk-background-transparent'
    },
    backgroundContent: {
        group: 'Background',
        name: 'Content',
        cssVar: '--tk-background-content'
    },
    backgroundContentTint: {
        group: 'Background',
        name: 'Content Tint',
        cssVar: '--tk-background-content-tint'
    },
    backgroundContentAttention: {
        group: 'Background',
        name: 'Content Attention',
        cssVar: '--tk-background-content-attention'
    },
    backgroundHighlighted: {
        group: 'Background',
        name: 'Highlighted',
        cssVar: '--tk-background-highlighted'
    },
    backgroundOverlayStrong: {
        group: 'Background',
        name: 'Overlay Strong',
        cssVar: '--tk-background-overlay-strong'
    },
    backgroundOverlayLight: {
        group: 'Background',
        name: 'Overlay Light',
        cssVar: '--tk-background-overlay-light'
    },
    backgroundOverlayExtraLight: {
        group: 'Background',
        name: 'Overlay Extra Light',
        cssVar: '--tk-background-overlay-extra-light'
    },
    backgroundContentPlaceholder: {
        group: 'Background',
        name: 'Content Placeholder',
        cssVar: '--tk-background-content-placeholder'
    },

    iconPrimary: { group: 'Icon', name: 'Primary', cssVar: '--tk-icon-primary' },
    iconSecondary: { group: 'Icon', name: 'Secondary', cssVar: '--tk-icon-secondary' },
    iconTertiary: { group: 'Icon', name: 'Tertiary', cssVar: '--tk-icon-tertiary' },
    iconPrimaryAlternate: {
        group: 'Icon',
        name: 'Primary Alternate',
        cssVar: '--tk-icon-primary-alternate'
    },

    buttonPrimaryBackground: {
        group: 'Button',
        name: 'Primary Background',
        cssVar: '--tk-button-primary-background'
    },
    buttonPrimaryForeground: {
        group: 'Button',
        name: 'Primary Foreground',
        cssVar: '--tk-button-primary-foreground'
    },
    buttonSecondaryBackground: {
        group: 'Button',
        name: 'Secondary Background',
        cssVar: '--tk-button-secondary-background'
    },
    buttonSecondaryForeground: {
        group: 'Button',
        name: 'Secondary Foreground',
        cssVar: '--tk-button-secondary-foreground'
    },
    buttonTertiaryBackground: {
        group: 'Button',
        name: 'Tertiary Background',
        cssVar: '--tk-button-tertiary-background'
    },
    buttonTertiaryForeground: {
        group: 'Button',
        name: 'Tertiary Foreground',
        cssVar: '--tk-button-tertiary-foreground'
    },
    buttonPrimaryBackgroundDisabled: {
        group: 'Button',
        name: 'Primary Background Disabled',
        cssVar: '--tk-button-primary-background-disabled'
    },
    buttonSecondaryBackgroundDisabled: {
        group: 'Button',
        name: 'Secondary Background Disabled',
        cssVar: '--tk-button-secondary-background-disabled'
    },
    buttonTertiaryBackgroundDisabled: {
        group: 'Button',
        name: 'Tertiary Background Disabled',
        cssVar: '--tk-button-tertiary-background-disabled'
    },
    buttonPrimaryBackgroundHighlighted: {
        group: 'Button',
        name: 'Primary Background Highlighted',
        cssVar: '--tk-button-primary-background-highlighted'
    },
    buttonSecondaryBackgroundHighlighted: {
        group: 'Button',
        name: 'Secondary Background Highlighted',
        cssVar: '--tk-button-secondary-background-highlighted'
    },
    buttonTertiaryBackgroundHighlighted: {
        group: 'Button',
        name: 'Tertiary Background Highlighted',
        cssVar: '--tk-button-tertiary-background-highlighted'
    },
    buttonPrimaryBackgroundGreen: {
        group: 'Button',
        name: 'Primary Background Green',
        cssVar: '--tk-button-primary-background-green'
    },
    buttonPrimaryBackgroundGreenHighlighted: {
        group: 'Button',
        name: 'Primary Background Green Highlighted',
        cssVar: '--tk-button-primary-background-green-highlighted'
    },
    buttonPrimaryBackgroundGreenDisabled: {
        group: 'Button',
        name: 'Primary Background Green Disabled',
        cssVar: '--tk-button-primary-background-green-disabled'
    },
    buttonPrimaryBackgroundRed: {
        group: 'Button',
        name: 'Primary Background Red',
        cssVar: '--tk-button-primary-background-red'
    },
    buttonPrimaryBackgroundRedHighlighted: {
        group: 'Button',
        name: 'Primary Background Red Highlighted',
        cssVar: '--tk-button-primary-background-red-highlighted'
    },
    buttonPrimaryBackgroundRedDisabled: {
        group: 'Button',
        name: 'Primary Background Red Disabled',
        cssVar: '--tk-button-primary-background-red-disabled'
    },

    fieldBackground: { group: 'Field', name: 'Background', cssVar: '--tk-field-background' },
    fieldActiveBorder: {
        group: 'Field',
        name: 'Active Border',
        cssVar: '--tk-field-active-border'
    },
    fieldErrorBorder: { group: 'Field', name: 'Error Border', cssVar: '--tk-field-error-border' },
    fieldErrorBackground: {
        group: 'Field',
        name: 'Error Background',
        cssVar: '--tk-field-error-background'
    },

    accentBlue: { group: 'Accent', name: 'Accent', cssVar: '--tk-accent-blue' },
    accentGreen: { group: 'Accent', name: 'Green', cssVar: '--tk-accent-green' },
    accentRed: { group: 'Accent', name: 'Red', cssVar: '--tk-accent-red' },
    accentOrange: { group: 'Accent', name: 'Orange', cssVar: '--tk-accent-orange' },
    accentPurple: { group: 'Accent', name: 'Purple', cssVar: '--tk-accent-purple' },

    tabBarActiveIcon: { group: 'TabBar', name: 'Active Icon', cssVar: '--tk-tabbar-active-icon' },
    tabBarInactiveIcon: {
        group: 'TabBar',
        name: 'Inactive Icon',
        cssVar: '--tk-tabbar-inactive-icon'
    },

    separatorCommon: { group: 'Separator', name: 'Common', cssVar: '--tk-separator-common' },
    separatorAlternate: {
        group: 'Separator',
        name: 'Alternate',
        cssVar: '--tk-separator-alternate'
    },

    constantBlack: {
        group: 'Constant & System',
        name: 'Constant Black',
        cssVar: '--tk-constant-black'
    },
    constantWhite: {
        group: 'Constant & System',
        name: 'Constant White',
        cssVar: '--tk-constant-white'
    },
    blue: { group: 'Constant & System', name: 'Blue', cssVar: '--tk-blue' },
    red: { group: 'Constant & System', name: 'Red', cssVar: '--tk-red' }
} satisfies Record<string, ColorTokenSpec>;

export type ColorToken = keyof typeof COLOR_TOKENS;
export type ColorPalette = Record<ColorToken, string>;

const blue: ColorPalette = {
    textPrimary: '#ffffff',
    textSecondary: '#8994a3',
    textTertiary: '#556170',
    textAccent: '#3c95fa',
    textPrimaryAlternate: '#000000',

    backgroundPage: '#10161f',
    backgroundTransparent: '#10161ff5',
    backgroundContent: '#1d2633',
    backgroundContentTint: '#2e3847',
    backgroundContentAttention: '#384457',
    backgroundHighlighted: '#c2daff0a',
    backgroundOverlayStrong: '#000000b8',
    backgroundOverlayLight: '#0000007a',
    backgroundOverlayExtraLight: '#0000003d',
    backgroundContentPlaceholder: '#ffffff14',

    iconPrimary: '#ffffff',
    iconSecondary: '#8994a3',
    iconTertiary: '#556170',
    iconPrimaryAlternate: '#000000',

    buttonPrimaryBackground: '#3c95fa',
    buttonPrimaryForeground: '#ffffff',
    buttonSecondaryBackground: '#1d2633',
    buttonSecondaryForeground: '#ffffff',
    buttonTertiaryBackground: '#2e3847',
    buttonTertiaryForeground: '#ffffff',
    buttonPrimaryBackgroundDisabled: '#387bc7',
    buttonSecondaryBackgroundDisabled: '#171f29',
    buttonTertiaryBackgroundDisabled: '#28303d',
    buttonPrimaryBackgroundHighlighted: '#55a2fa',
    buttonSecondaryBackgroundHighlighted: '#222c3b',
    buttonTertiaryBackgroundHighlighted: '#364052',
    buttonPrimaryBackgroundGreen: '#39cc83',
    buttonPrimaryBackgroundGreenHighlighted: '#49cc8b',
    buttonPrimaryBackgroundGreenDisabled: '#2b9962',
    buttonPrimaryBackgroundRed: '#ff4766',
    buttonPrimaryBackgroundRedHighlighted: '#ff5e79',
    buttonPrimaryBackgroundRedDisabled: '#c2364e',

    fieldBackground: '#1d2633',
    fieldActiveBorder: '#3c95fa',
    fieldErrorBorder: '#ff4766',
    fieldErrorBackground: '#ff476614',

    accentBlue: '#3c95fa',
    accentGreen: '#39cc83',
    accentRed: '#ff4766',
    accentOrange: '#f5a73b',
    accentPurple: '#7665e5',

    tabBarActiveIcon: '#3c95fa',
    tabBarInactiveIcon: '#8994a3',

    separatorCommon: '#c2daff14',
    separatorAlternate: '#ffffff14',

    constantBlack: '#000000',
    constantWhite: '#ffffff',
    blue: '#0077ff',
    red: '#ff3b30'
};

const dark: ColorPalette = {
    textPrimary: '#ebebeb',
    textSecondary: '#8d8d93',
    textTertiary: '#4e4e52',
    textAccent: '#3c95fa',
    textPrimaryAlternate: '#000000',

    backgroundPage: '#000000',
    backgroundTransparent: '#000000f5',
    backgroundContent: '#17171a',
    backgroundContentTint: '#272729',
    backgroundContentAttention: '#2f2f33',
    backgroundHighlighted: '#ffffff14',
    backgroundOverlayStrong: '#1f1f1fb8',
    backgroundOverlayLight: '#1f1f1f7a',
    backgroundOverlayExtraLight: '#1f1f1f3d',
    backgroundContentPlaceholder: '#ffffff14',

    iconPrimary: '#ebebeb',
    iconSecondary: '#8d8d93',
    iconTertiary: '#4e4e52',
    iconPrimaryAlternate: '#000000',

    buttonPrimaryBackground: '#3c95fa',
    buttonPrimaryForeground: '#ffffff',
    buttonSecondaryBackground: '#1b1b1f',
    buttonSecondaryForeground: '#ebebeb',
    buttonTertiaryBackground: '#2b2b2e',
    buttonTertiaryForeground: '#ebebeb',
    buttonPrimaryBackgroundDisabled: '#387bc7',
    buttonSecondaryBackgroundDisabled: '#0e0e0f',
    buttonTertiaryBackgroundDisabled: '#18181a',
    buttonPrimaryBackgroundHighlighted: '#55a2fa',
    buttonSecondaryBackgroundHighlighted: '#242429',
    buttonTertiaryBackgroundHighlighted: '#353538',
    buttonPrimaryBackgroundGreen: '#39cc83',
    buttonPrimaryBackgroundGreenHighlighted: '#49cc8b',
    buttonPrimaryBackgroundGreenDisabled: '#2b9962',
    buttonPrimaryBackgroundRed: '#ff4766',
    buttonPrimaryBackgroundRedHighlighted: '#ff5e79',
    buttonPrimaryBackgroundRedDisabled: '#c2364e',

    fieldBackground: '#17171a',
    fieldActiveBorder: '#3c95fa',
    fieldErrorBorder: '#ff4766',
    fieldErrorBackground: '#ff476614',

    accentBlue: '#3c95fa',
    accentGreen: '#39cc83',
    accentRed: '#ff4766',
    accentOrange: '#f5a73b',
    accentPurple: '#7665e5',

    tabBarActiveIcon: '#3c95fa',
    tabBarInactiveIcon: '#8d8d93',

    separatorCommon: '#ffffff1f',
    separatorAlternate: '#ffffff14',

    constantBlack: '#000000',
    constantWhite: '#ffffff',
    blue: '#0077ff',
    red: '#ff3b30'
};

const light: ColorPalette = {
    textPrimary: '#000000',
    textSecondary: '#818c99',
    textTertiary: '#95a0ad',
    textAccent: '#007aff',
    textPrimaryAlternate: '#ffffff',

    backgroundPage: '#efeef3',
    backgroundTransparent: '#fffffff5',
    backgroundContent: '#ffffff',
    backgroundContentTint: '#e7e6eb',
    backgroundContentAttention: '#f0f0f0',
    backgroundHighlighted: '#818c9914',
    backgroundOverlayStrong: '#000000b8',
    backgroundOverlayLight: '#0000007a',
    backgroundOverlayExtraLight: '#0000003d',
    backgroundContentPlaceholder: '#00000014',

    iconPrimary: '#000000',
    iconSecondary: '#818c99',
    iconTertiary: '#95a0ad',
    iconPrimaryAlternate: '#ffffff',

    buttonPrimaryBackground: '#007aff',
    buttonPrimaryForeground: '#ffffff',
    buttonSecondaryBackground: '#d3d4db',
    buttonSecondaryForeground: '#000000',
    buttonTertiaryBackground: '#d3d4db',
    buttonTertiaryForeground: '#000000',
    buttonPrimaryBackgroundDisabled: '#3d9aff',
    buttonSecondaryBackgroundDisabled: '#d8d9e0',
    buttonTertiaryBackgroundDisabled: '#d8d9e0',
    buttonPrimaryBackgroundHighlighted: '#1f8aff',
    buttonSecondaryBackgroundHighlighted: '#c9cad1',
    buttonTertiaryBackgroundHighlighted: '#c9cad1',
    buttonPrimaryBackgroundGreen: '#25b86f',
    buttonPrimaryBackgroundGreenHighlighted: '#17c26d',
    buttonPrimaryBackgroundGreenDisabled: '#2b9962',
    buttonPrimaryBackgroundRed: '#ff4766',
    buttonPrimaryBackgroundRedHighlighted: '#ff5e79',
    buttonPrimaryBackgroundRedDisabled: '#c2364e',

    fieldBackground: '#818c991f',
    fieldActiveBorder: '#007aff',
    fieldErrorBorder: '#ff3b30',
    fieldErrorBackground: '#ff3b3014',

    accentBlue: '#007aff',
    accentGreen: '#25b86f',
    accentRed: '#ff3b30',
    accentOrange: '#f5a73b',
    accentPurple: '#7665e5',

    tabBarActiveIcon: '#007aff',
    tabBarInactiveIcon: '#95a0ad',

    separatorCommon: '#3c3c431f',
    separatorAlternate: '#3c3c4314',

    constantBlack: '#000000',
    constantWhite: '#ffffff',
    blue: '#0077ff',
    red: '#ff3b30'
};

export const COLOR_PALETTES: Record<ColorThemeName, ColorPalette> = { blue, dark, light };
