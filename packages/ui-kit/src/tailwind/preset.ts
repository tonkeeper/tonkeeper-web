import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';
import { COLOR_PALETTES, COLOR_TOKENS, ColorToken } from '../theme/colorThemes';

const TOKENS = Object.keys(COLOR_TOKENS) as ColorToken[];

const FONT_FALLBACKS =
    "-apple-system, blinkmacsystemfont, 'Segoe UI', roboto, 'Helvetica Neue', 'Noto Sans', arial, sans-serif";

/**
 * Keeper design tokens for Tailwind. Every colour and radius resolves to a
 * `--tk-*` custom property, so `ThemeProvider` switches themes by rewriting
 * the properties and no class changes.
 */
const preset = {
    content: [],
    theme: {
        extend: {
            colors: Object.fromEntries(
                TOKENS.map(token => [token, `var(${COLOR_TOKENS[token].cssVar})`])
            ),
            borderRadius: {
                extraExtraSmall: 'var(--tk-rounding-extra-extra-small)',
                extraSmall: 'var(--tk-rounding-extra-small)',
                small: 'var(--tk-rounding-small)',
                medium: 'var(--tk-rounding-medium)',
                large: 'var(--tk-rounding-large)',
                full: 'var(--tk-rounding-full)'
            },
            fontFamily: {
                // A variable rather than a list so `:root:lang(vi)` can swap the
                // whole stack.
                sans: ['var(--tk-font-sans)'],
                mono: [
                    'ui-monospace',
                    'SF Mono',
                    'monospace',
                    'Roboto Mono',
                    'Menlo',
                    'Consolas',
                    'Courier'
                ]
            },
            fontSize: {
                // Each entry is a complete text style. Weights are the three
                // faces TT Firs Neue draws (450 / 500 / 600) — any other weight
                // would be synthesised. Tracking is a share of the size, hence
                // `em`. `text-body4Caps` needs `uppercase` at the call site.
                num1: ['44px', { lineHeight: '56px', fontWeight: '500' }],
                num2: ['32px', { lineHeight: '40px', fontWeight: '500' }],
                num3: ['28px', { lineHeight: '36px', fontWeight: '500' }],
                h1: ['32px', { lineHeight: '40px', fontWeight: '600' }],
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
                label3: [
                    '12px',
                    { lineHeight: '16px', fontWeight: '500', letterSpacing: '0.01em' }
                ],
                body1: [
                    '16px',
                    { lineHeight: '24px', fontWeight: '450', letterSpacing: '0.005em' }
                ],
                body2: [
                    '14px',
                    { lineHeight: '20px', fontWeight: '450', letterSpacing: '0.005em' }
                ],
                body3Alt: [
                    '13px',
                    { lineHeight: '16px', fontWeight: '450', letterSpacing: '0.01em' }
                ],
                body3: ['12px', { lineHeight: '16px', fontWeight: '450', letterSpacing: '0.01em' }],
                body4Caps: [
                    '10px',
                    { lineHeight: '14px', fontWeight: '500', letterSpacing: '0.01em' }
                ]
            },
            keyframes: {
                shake: {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '16.67%, 50%, 83.33%': { transform: 'translateX(10px)' },
                    '33.33%, 66.67%': { transform: 'translateX(-10px)' }
                },
                drain: {
                    from: { strokeDashoffset: '0' },
                    to: { strokeDashoffset: 'var(--tk-drain-length)' }
                }
            },
            animation: {
                shake: 'shake 0.42s linear',
                drain: 'drain var(--tk-drain-duration) linear forwards'
            }
        }
    },
    plugins: [
        plugin(({ addBase, addComponents }) => {
            addBase({
                ':root': {
                    ...Object.fromEntries(
                        TOKENS.map(token => [
                            COLOR_TOKENS[token].cssVar,
                            COLOR_PALETTES.blue[token]
                        ])
                    ),
                    '--tk-rounding-extra-extra-small': '4px',
                    '--tk-rounding-extra-small': '8px',
                    '--tk-rounding-small': '12px',
                    '--tk-rounding-medium': '16px',
                    '--tk-rounding-large': '20px',
                    // Not `100%`, which draws an ellipse on non-square boxes.
                    '--tk-rounding-full': '9999px',
                    '--tk-skeleton-fill': 'var(--tk-background-content)',
                    // The hosted TT Firs Neue stylesheet switches on its
                    // stylistic alternates; bundled Inter maps those tags to
                    // different glyphs.
                    '--tk-font-features': 'normal',
                    '--tk-font-sans': `'TT Firs Neue', 'Inter', ${FONT_FALLBACKS}`,
                    fontFeatureSettings: 'var(--tk-font-features)',
                    colorScheme: 'dark'
                },
                // TT Firs Neue lacks the Vietnamese horn and hook-above marks,
                // and per-glyph fallback would mix two fonts inside one word.
                ':root:lang(vi)': {
                    '--tk-font-sans': `'Inter', ${FONT_FALLBACKS}`,
                    '--tk-font-features': 'normal'
                }
            });
            // Owns `transition-property` (colours + transform), so an element
            // using it must not also carry a `transition-*` utility.
            addComponents({
                '.pressable': {
                    transitionProperty:
                        'color, background-color, border-color, opacity, box-shadow, transform',
                    transitionTimingFunction: 'cubic-bezier(0.33, 1, 0.68, 1)',
                    transitionDuration: '200ms',
                    '-webkit-tap-highlight-color': 'transparent',
                    '&:active:not(:disabled)': {
                        transform: 'scale(0.98)',
                        transitionDuration: '100ms'
                    },
                    '@media (prefers-reduced-motion: reduce)': {
                        '&:active': { transform: 'none' }
                    }
                }
            });
        })
    ]
} satisfies Config;

export default preset;
