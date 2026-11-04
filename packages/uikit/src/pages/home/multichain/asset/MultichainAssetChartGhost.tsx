import { FC } from 'react';

/**
 * Decorative stand-in sparkline shown while the real chart data loads, traced
 * from the loading mockup's asset. Colors resolve through the theme variables
 * the mockup's hexes correspond to (stroke `background/content-tint`, area
 * fade `background/content`), so it follows theme changes like the real chart.
 */
/**
 * "No price data is available." glyph — the flat wave shown centered in the
 * chart area when the backend has no series for the asset, traced from the
 * mockup's vector (its hex is `text/tertiary`).
 */
export const ChartNoDataWave: FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 123 20" fill="none" aria-hidden className={className}>
        <path
            d="M2.00004 10L3.19004 8.99535L4.38004 8.00655L5.57004 7.04918L6.76004 6.13835L7.95004 5.28842L9.14004 4.5128L10.33 3.82371L11.52 3.23202L12.71 2.74707L13.9 2.3765L15.09 2.12616L16.28 2H17.47L18.66 2.12616L19.85 2.3765L21.04 2.74707L22.23 3.23202L23.42 3.82371L24.61 4.5128L25.8 5.28842L26.99 6.13835L28.18 7.04918L29.37 8.00655L30.56 8.99535L31.75 10L32.94 11.0046L34.13 11.9935L35.32 12.9508L36.51 13.8616L37.7 14.7116L38.89 15.4872L40.08 16.1763L41.27 16.768L42.46 17.2529L43.65 17.6235L44.84 17.8738L46.03 18H47.22L48.41 17.8738L49.6 17.6235L50.79 17.2529L51.98 16.768L53.17 16.1763L54.36 15.4872L55.55 14.7116L56.74 13.8616L57.93 12.9508L59.12 11.9935L60.31 11.0046L61.5 10L62.69 8.99535L63.88 8.00655L65.07 7.04918L66.26 6.13835L67.45 5.28842L68.64 4.5128L69.83 3.82371L71.02 3.23202L72.21 2.74707L73.4 2.3765L74.59 2.12616L75.78 2L76.97 2L78.16 2.12616L79.35 2.3765L80.54 2.74707L81.73 3.23202L82.92 3.82371L84.11 4.5128L85.3 5.28842L86.49 6.13835L87.68 7.04918L88.87 8.00655L90.06 8.99535L91.25 10L92.44 11.0046L93.63 11.9935L94.82 12.9508L96.01 13.8616L97.2 14.7116L98.39 15.4872L99.58 16.1763L100.77 16.768L101.96 17.2529L103.15 17.6235L104.34 17.8738L105.53 18H106.72L107.91 17.8738L109.1 17.6235L110.29 17.2529L111.48 16.768L112.67 16.1763L113.86 15.4872L115.05 14.7116L116.24 13.8616L117.43 12.9508L118.62 11.9935L119.81 11.0046L121 10"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
        />
    </svg>
);

export const MultichainAssetChartGhost: FC<{ className?: string }> = ({ className }) => (
    <svg
        preserveAspectRatio="none"
        viewBox="0 0 390 165"
        fill="none"
        aria-hidden
        className={className}
    >
        <defs>
            <linearGradient
                id="tk-chart-ghost-fade"
                x1="235"
                y1="24"
                x2="236"
                y2="165"
                gradientUnits="userSpaceOnUse"
            >
                <stop stopColor="var(--tk-background-content)" />
                <stop offset="1" stopColor="var(--tk-background-content)" stopOpacity="0" />
            </linearGradient>
        </defs>
        <path
            opacity="0.8"
            fill="url(#tk-chart-ghost-fade)"
            d="M16 125L4.00004 145L0 145L4.05312e-05 154V165H390V41H380L372 17L362 21L350 9L340 15L328 14L316 24L304 6L292 56L280 58L268 72L255.5 0L244 19L232 26L218.5 6L207 19L196 16L184 39L172 37L160 57L148 64L136 85L124 72L112 76L100 96L88 142L76 146L64 131L52 165L40 151L28 154L16 125Z"
        />
        <path
            stroke="var(--tk-background-content-tint)"
            strokeWidth="2"
            d="M390 41H380L372 17L362 21L350 9L340 15L328 14L316 24L304 6L292 56L280 58L268 72L255.5 0L244 19L232 26L218.5 6L207 19L196 16L184 39L172 37L160 57L148 64L136 85L124 72L112 76L100 96L88 142L76 146L64 131L52 165L40 151L28 154L16 125L4 145H0"
        />
    </svg>
);
