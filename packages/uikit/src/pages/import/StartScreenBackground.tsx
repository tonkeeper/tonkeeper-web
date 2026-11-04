import { FC } from 'react';

/**
 * The glow behind the start screen: the brand mark's silhouette blown far past
 * the viewport, filled with a gradient and blurred.
 *
 * The silhouette is a mask rather than artwork so it stays sharp at any width,
 * and the blur is applied to the *parent* of the masked layer — masking first
 * and blurring after would clip the soft edge back to a crisp mark.
 *
 * The design stacks two identical copies of the layer. Drawn that way in one
 * pass the glow's tails reach much further down and out than the mockup does,
 * because two stacked copies multiply coverage by itself. `feFuncA gamma 2`
 * squares the alpha directly, which leaves the saturated middle alone and pulls
 * the thin tails back. The radius is the one the native app fitted against the
 * design's own render (the file states 81.25, which measures further off) — if
 * the artwork changes, measure again rather than trusting the number.
 *
 * Geometry is expressed against the mockup's 390px frame and scaled by
 * `--tk-glow-scale`, so a narrow phone shrinks the whole composition instead of
 * cropping it, and anything wider than the content column leaves it at 1:1.
 */
const SILHOUETTE = [
    [1, 0.22217],
    [0.99926, 0.2225],
    [0.49973, 1],
    [0, 0.22217],
    [0.49973, 0.44439],
    [0.49995, 0.4443],
    [0, 0.22217],
    [0.49999, 0],
    [1, 0.22217]
]
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`)
    .join('');

// `preserveAspectRatio="none"` lets the unit-square path stretch to the layer's
// own aspect ratio, so the points can stay the design's fractions.
const MASK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1" preserveAspectRatio="none"><path d="${SILHOUETTE}Z" fill="#fff"/></svg>`;
const MASK_URL = `url("data:image/svg+xml,${encodeURIComponent(MASK_SVG)}")`;

const GRADIENT_STOPS = [
    '#3d9fff',
    '#3899ff',
    '#3493ff',
    '#2e8cff',
    '#2986ff',
    '#247fff',
    '#1f79ff',
    '#1a73ff',
    '#156cff',
    '#1066ff',
    '#0b5fff',
    '#0659ff',
    '#0442c5',
    '#032e93',
    '#011759'
];

// 144.72deg is the design's gradient vector — down and to the right — resolved
// against the layer's box.
const GRADIENT = `linear-gradient(144.72deg, ${GRADIENT_STOPS.map(
    (color, i) => `${color} ${((i / (GRADIENT_STOPS.length - 1)) * 100).toFixed(4)}%`
).join(', ')})`;

const FALLOFF_FILTER_ID = 'tk-start-glow-falloff';

const px = (value: number) => `calc(${value}px * var(--tk-glow-scale))`;

export const StartScreenBackground: FC = () => (
    <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
        style={{ '--tk-glow-scale': 'calc(min(100vw, 390px) / 390)' } as React.CSSProperties}
    >
        <svg width="0" height="0" className="absolute">
            <filter id={FALLOFF_FILTER_ID} colorInterpolationFilters="sRGB">
                <feComponentTransfer>
                    <feFuncA type="gamma" exponent={2} amplitude={1} offset={0} />
                </feComponentTransfer>
            </filter>
        </svg>

        <div className="absolute left-1/2 top-0 -translate-x-1/2" style={{ width: px(390) }}>
            <div
                className="absolute"
                style={{
                    left: px(-150.694),
                    top: px(-219),
                    width: px(691.694),
                    height: px(684.306),
                    filter: `blur(${px(74)}) url(#${FALLOFF_FILTER_ID})`
                }}
            >
                <div
                    className="size-full"
                    style={{
                        background: GRADIENT,
                        maskImage: MASK_URL,
                        WebkitMaskImage: MASK_URL,
                        maskSize: '100% 100%',
                        WebkitMaskSize: '100% 100%',
                        maskRepeat: 'no-repeat',
                        WebkitMaskRepeat: 'no-repeat'
                    }}
                />
            </div>
        </div>
    </div>
);
