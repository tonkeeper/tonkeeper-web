import type { Config } from 'tailwindcss';
import { join } from 'path';

/**
 * Self-contained on purpose. The wallet's Tailwind config resolves its colors
 * from `--tk-*` custom properties that `UserThemeProvider` writes at runtime,
 * and this app deliberately carries no `uikit` — so it declares the handful of
 * dark-theme values and type steps it needs as literals, kept in step with
 * `packages/uikit/src/styles/defaultTheme.ts` and `packages/uikit/tailwind.config.ts`.
 */
const config: Config = {
    content: [join(__dirname, 'src/**/*.{ts,tsx}')],
    theme: {
        extend: {
            colors: {
                textPrimary: '#FFFFFF',
                textSecondary: '#8994A3',
                textTertiary: '#556170',
                textAccent: '#3C95FA',
                backgroundPage: '#10161F',
                /** `backgroundOverlayStrong` (black at 72%) laid over `backgroundPage`. */
                backgroundBackdrop: '#050609',
                backgroundContent: '#1D2633',
                backgroundContentTint: '#2E3847',
                buttonPrimaryBackground: '#3C95FA',
                buttonPrimaryBackgroundHighlighted: '#55A2FA',
                buttonPrimaryBackgroundDisabled: '#387BC7',
                buttonSecondaryBackground: '#1D2633',
                buttonSecondaryBackgroundHighlighted: '#222C3B',
                buttonSecondaryBackgroundDisabled: '#171F29',
                fieldBackground: '#1D2633',
                fieldActiveBorder: '#3C95FA',
                fieldErrorBorder: '#FF4766',
                fieldErrorBackground: 'rgba(255, 71, 102, 0.08)',
                accentBlue: '#3C95FA',
                accentRed: '#FF4766'
            },
            fontFamily: {
                sans: [
                    'TT Firs Neue',
                    '-apple-system',
                    'BlinkMacSystemFont',
                    'Segoe UI',
                    'Roboto',
                    'Helvetica Neue',
                    'Noto Sans',
                    'Arial',
                    'sans-serif'
                ]
            },
            fontSize: {
                h2: ['24px', { lineHeight: '32px', fontWeight: '600' }],
                h3: ['20px', { lineHeight: '28px', fontWeight: '600' }],
                label1: [
                    '16px',
                    { lineHeight: '24px', fontWeight: '500', letterSpacing: '0.005em' }
                ],
                label2: [
                    '14px',
                    { lineHeight: '20px', fontWeight: '500', letterSpacing: '0.005em' }
                ],
                body1: [
                    '16px',
                    { lineHeight: '24px', fontWeight: '450', letterSpacing: '0.005em' }
                ],
                body2: [
                    '14px',
                    { lineHeight: '20px', fontWeight: '450', letterSpacing: '0.005em' }
                ],
                body4Caps: [
                    '10px',
                    { lineHeight: '14px', fontWeight: '500', letterSpacing: '0.01em' }
                ]
            }
        }
    },
    plugins: []
};

export default config;
