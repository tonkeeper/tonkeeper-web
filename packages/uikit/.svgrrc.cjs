/**
 * SVGR config — turns `src/icons/svg/*.svg` into typed, tree-shakeable React
 * components in `src/icons/components/`. Runs SVGO (see `svgo.config.cjs`)
 * first, so paint is already `currentColor` and dimensions are stripped.
 *
 * `dimensions: false` means the generated <svg> has no intrinsic size — size
 * it at the call site (`className="w-4 h-4"` or a `width`/`height` prop, which
 * `expandProps: 'end'` forwards along with `className`, `onClick`, etc.).
 */
module.exports = {
    typescript: true,
    jsxRuntime: 'automatic',
    expandProps: 'end',
    dimensions: false,
    svgo: true,
    svgoConfig: require('./svgo.config.cjs'),
    // Generated components are imported individually; the index is a convenience
    // barrel, but prefer `import IcSnowflake16 from '.../components/IcSnowflake16'`
    // for guaranteed tree-shaking across the app bundlers.
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
