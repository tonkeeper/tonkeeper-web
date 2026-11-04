/**
 * SVGR config for *illustrations* — multi-color hero art generated from
 * `src/illustrations/svg/*.svg` into `src/illustrations/components/*.tsx`.
 *
 * Mirrors `.svgrrc.cjs` (icons) but swaps the SVGO config for
 * `svgo.illustrations.config.cjs`, which preserves multi-color paint
 * and gradient ids. As with icons, `dimensions: false` strips intrinsic
 * size so the call site decides via `className` or a `width`/`height`
 * prop (forwarded by `expandProps: 'end'`).
 */
module.exports = {
    typescript: true,
    jsxRuntime: 'automatic',
    expandProps: 'end',
    dimensions: false,
    svgo: true,
    svgoConfig: require('./svgo.illustrations.config.cjs'),
    // Without this, SVGR's cosmiconfig walks up from each SVG file looking
    // for a `.svgrrc.*` / `svgo.config.*` and finds the sibling icons config
    // (which forces `currentColor` and drops gradients). Disabling the
    // per-file runtime search keeps `svgoConfig` above as the only source.
    runtimeConfig: false,
    indexTemplate: defaultIndexTemplate
};

/** One named re-export per file (no default-export barrel). */
function defaultIndexTemplate(filePaths) {
    return filePaths
        .map(({ path: p }) => {
            const name = require('path').basename(p, require('path').extname(p));
            return `export { default as ${name} } from './${name}';`;
        })
        .join('\n');
}
