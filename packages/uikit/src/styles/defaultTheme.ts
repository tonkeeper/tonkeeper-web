import { DefaultTheme } from 'styled-components';

export const defaultTheme: DefaultTheme = {
    textPrimary: '#FFFFFF',
    textSecondary: '#8994A3',
    textTertiary: '#556170',
    textAccent: '#3C95FA',
    textPrimaryAlternate: '#000000',

    backgroundPage: '#10161F',
    backgroundTransparent: 'rgba(16, 22, 31, 0.96)',
    backgroundContent: '#1D2633',
    backgroundContentTint: '#2E3847',
    backgroundContentAttention: '#384457',
    backgroundOverlayStrong: 'rgba(0, 0, 0, 0.72)',
    backgroundOverlayLight: 'rgba(0, 0, 0, 0.48)',
    backgroundOverlayExtraLight: 'rgba(0, 0, 0, 0.24)',
    backgroundHighlighted: 'rgba(194, 218, 255, 0.04)',

    iconPrimary: '#FFFFFF',
    iconSecondary: '#8994A3',
    iconTertiary: '#556170',
    iconPrimaryAlternate: '#000000',

    buttonPrimaryBackground: '#3C95FA',
    buttonPrimaryForeground: '#FFFFFF',
    buttonSecondaryBackground: '#1D2633',
    buttonSecondaryForeground: '#FFFFFF',
    buttonTertiaryBackground: '#2E3847',
    buttonTertiaryForeground: '#FFFFFF',
    buttonWarnBackground: '#F5A73B',
    buttonWarnForeground: '#FFFFFF',
    buttonPrimaryBackgroundDisabled: '#387BC7',
    buttonSecondaryBackgroundDisabled: '#171F29',
    buttonTertiaryBackgroundDisabled: '#28303D',
    buttonWarnBackgroundDisabled: '#C2842F',

    buttonTertiaryForegroundDisabled: 'rgba(256, 256, 256, 0.48)',
    buttonSecondaryForegroundDisabled: 'rgba(256, 256, 256, 0.48)',
    buttonPrimaryForegroundDisabled: 'rgba(256, 256, 256, 0.48)',
    buttonWarnForegroundDisabled: 'rgba(256, 256, 256, 0.48)',

    buttonPrimaryBackgroundHighlighted: '#55A2FA',
    buttonSecondaryBackgroundHighlighted: 'rgba(34, 44, 59, 1)',
    buttonTertiaryBackgroundHighlighted: 'rgba(54, 64, 82, 1)',
    buttonWarnBackgroundHighlighted: '#F5AF4E',

    fieldBackground: '#1D2633',
    fieldActiveBorder: '#3C95FA',
    fieldErrorBorder: '#FF4766',
    fieldErrorBackground: 'rgba(255, 71, 102, 0.08)',

    accentBlue: '#3C95FA',
    accentBlueConstant: '#3C95FA',
    accentGreen: '#39CC83',
    accentRed: '#FF4766',
    accentOrange: '#F5A73B',
    accentPurple: '#7665E5',

    tabBarActiveIcon: '#3C95FA',
    tabBarInactiveIcon: '#8994A3',

    separatorCommon: 'rgba(194, 218, 255, 0.08)',
    separatorAlternate: 'rgba(255, 255, 255, 0.08)',

    gradientBackgroundTop:
        'linear-gradient(180deg, #10161F 0%, rgba(16, 22, 31, 0.991353) 6.67%, rgba(16, 22, 31, 0.96449) 13.33%, rgba(16, 22, 31, 0.91834) 20%, rgba(16, 22, 31, 0.852589) 26.67%, rgba(16, 22, 31, 0.768225) 33.33%, rgba(16, 22, 31, 0.668116) 40%, rgba(16, 22, 31, 0.557309) 46.67%, rgba(16, 22, 31, 0.442691) 53.33%, rgba(16, 22, 31, 0.331884) 60%, rgba(16, 22, 31, 0.231775) 66.67%, rgba(16, 22, 31, 0.147411) 73.33%, rgba(16, 22, 31, 0.0816599) 80%, rgba(16, 22, 31, 0.03551) 86.67%, rgba(16, 22, 31, 0.0086472) 93.33%, rgba(16, 22, 31, 0) 100%)',
    gradientBackgroundBottom:
        'linear-gradient(360deg, #10161F 0%, rgba(16, 22, 31, 0.991353) 6.67%, rgba(16, 22, 31, 0.96449) 13.33%, rgba(16, 22, 31, 0.91834) 20%, rgba(16, 22, 31, 0.852589) 26.67%, rgba(16, 22, 31, 0.768225) 33.33%, rgba(16, 22, 31, 0.668116) 40%, rgba(16, 22, 31, 0.557309) 46.67%, rgba(16, 22, 31, 0.442691) 53.33%, rgba(16, 22, 31, 0.331884) 60%, rgba(16, 22, 31, 0.231775) 66.67%, rgba(16, 22, 31, 0.147411) 73.33%, rgba(16, 22, 31, 0.0816599) 80%, rgba(16, 22, 31, 0.03551) 86.67%, rgba(16, 22, 31, 0.0086472) 93.33%, rgba(16, 22, 31, 0) 100%)',
    gradientBlueTop:
        'linear-gradient(180deg, #3C95FA 0%, rgba(60, 149, 250, 0.991353) 6.67%, rgba(60, 149, 250, 0.96449) 13.33%, rgba(60, 149, 250, 0.91834) 20%, rgba(60, 149, 250, 0.852589) 26.67%, rgba(60, 149, 250, 0.768225) 33.33%, rgba(60, 149, 250, 0.668116) 40%, rgba(60, 149, 250, 0.557309) 46.67%, rgba(60, 149, 250, 0.442691) 53.33%, rgba(60, 149, 250, 0.331884) 60%, rgba(60, 149, 250, 0.231775) 66.67%, rgba(60, 149, 250, 0.147411) 73.33%, rgba(60, 149, 250, 0.0816599) 80%, rgba(60, 149, 250, 0.03551) 86.67%, rgba(60, 149, 250, 0.0086472) 93.33%, rgba(60, 149, 250, 0) 100%)',
    gradientBlueBottom:
        'linear-gradient(0deg, #3C95FA 0%, rgba(60, 149, 250, 0.991353) 6.67%, rgba(60, 149, 250, 0.96449) 13.33%, rgba(60, 149, 250, 0.91834) 20%, rgba(60, 149, 250, 0.852589) 26.67%, rgba(60, 149, 250, 0.768225) 33.33%, rgba(60, 149, 250, 0.668116) 40%, rgba(60, 149, 250, 0.557309) 46.67%, rgba(60, 149, 250, 0.442691) 53.33%, rgba(60, 149, 250, 0.331884) 60%, rgba(60, 149, 250, 0.231775) 66.67%, rgba(60, 149, 250, 0.147411) 73.33%, rgba(60, 149, 250, 0.0816599) 80%, rgba(60, 149, 250, 0.03551) 86.67%, rgba(60, 149, 250, 0.0086472) 93.33%, rgba(60, 149, 250, 0) 100%)',
    gradientGreen:
        'linear-gradient(180deg, #39CC83 0%, rgba(57, 204, 131, 0.991353) 6.67%, rgba(57, 204, 131, 0.96449) 13.33%, rgba(57, 204, 131, 0.91834) 20%, rgba(57, 204, 131, 0.852589) 26.67%, rgba(57, 204, 131, 0.768225) 33.33%, rgba(57, 204, 131, 0.668116) 40%, rgba(57, 204, 131, 0.557309) 46.67%, rgba(57, 204, 131, 0.442691) 53.33%, rgba(57, 204, 131, 0.331884) 60%, rgba(57, 204, 131, 0.231775) 66.67%, rgba(57, 204, 131, 0.147411) 73.33%, rgba(57, 204, 131, 0.0816599) 80%, rgba(57, 204, 131, 0.03551) 86.67%, rgba(57, 204, 131, 0.0086472) 93.33%, rgba(57, 204, 131, 0) 100%)',
    gradientRed:
        'linear-gradient(180deg, #FF4766 0%, rgba(255, 71, 102, 0.991353) 6.67%, rgba(255, 71, 102, 0.96449) 13.33%, rgba(255, 71, 102, 0.91834) 20%, rgba(255, 71, 102, 0.852589) 26.67%, rgba(255, 71, 102, 0.768225) 33.33%, rgba(255, 71, 102, 0.668116) 40%, rgba(255, 71, 102, 0.557309) 46.67%, rgba(255, 71, 102, 0.442691) 53.33%, rgba(255, 71, 102, 0.331884) 60%, rgba(255, 71, 102, 0.231775) 66.67%, rgba(255, 71, 102, 0.147411) 73.33%, rgba(255, 71, 102, 0.0816599) 80%, rgba(255, 71, 102, 0.03551) 86.67%, rgba(255, 71, 102, 0.0086472) 93.33%, rgba(255, 71, 102, 0) 100%)',

    constantBlack: '#000000',
    constantWhite: '#FFFFFF',
    blue: '#0077FF',
    red: '#FF3B30',

    corner3xSmall: '4px',
    corner2xSmall: '8px',
    cornerExtraSmall: '12px',
    cornerSmall: '16px',
    cornerMedium: '20px',
    cornerLarge: '24px',
    cornerFull: '100%',
    fontMono: 'ui-monospace, SF Mono, monospace, Roboto Mono, Menlo, Consolas, Courier',
    displayType: 'compact',
    proDisplayType: undefined,
    os: undefined
};
