import 'styled-components';

declare module 'styled-components' {
    export interface DefaultTheme {
        textPrimary: string;
        textSecondary: string;
        textTertiary: string;
        textAccent: string;
        textPrimaryAlternate: string;

        backgroundPage: string;
        backgroundTransparent: string;
        backgroundContent: string;
        backgroundContentTint: string;
        backgroundOverlayStrong: string;
        backgroundOverlayLight: string;
        backgroundOverlayExtraLight: string;
        backgroundHighlighted: string;

        iconPrimary: string;
        iconSecondary: string;
        iconTertiary: string;
        iconPrimaryAlternate: string;

        buttonPrimaryBackground: string;
        buttonPrimaryForeground: string;
        buttonSecondaryBackground: string;
        buttonSecondaryForeground: string;
        buttonTertiaryBackground: string;
        buttonTertiaryForeground: string;
        buttonPrimaryBackgroundDisabled: string;
        buttonSecondaryBackgroundDisabled: string;
        buttonTertiaryBackgroundDisabled: string;

        buttonPrimaryBackgroundHighlighted: string;
        buttonSecondaryBackgroundHighlighted: string;
        buttonTertiaryBackgroundHighlighted: string;

        buttonTertiaryForegroundDisabled: string;
        buttonSecondaryForegroundDisabled: string;
        buttonPrimaryForegroundDisabled: string;

        fieldBackground: string;
        fieldActiveBorder: string;
        fieldErrorBorder: string;
        fieldErrorBackground: string;

        accentBlue: string;
        accentGreen: string;
        accentRed: string;
        accentOrange: string;
        accentPurple: string;

        tabBarActiveIcon: string;
        tabBarInactiveIcon: string;

        separatorCommon: string;
        separatorAlternate: string;

        gradientBackgroundTop: string;
        gradientBackgroundBottom: string;
        gradientBlueTop: string;
        gradientBlueBottom: string;
        gradientGreen: string;
        gradientRed: string;

        constantBlack: string;
        constantWhite: string;
        blue: string;
        red: string;

        cornerExtraExtraSmall: string;
        cornerExtraSmall: string;
        cornerSmall: string;
        cornerMedium: string;
        cornerLarge: string;
        cornerFull: string;

        fontMono: string;
    }
}
