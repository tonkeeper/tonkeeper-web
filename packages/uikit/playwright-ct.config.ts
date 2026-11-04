import { defineConfig, devices } from '@playwright/experimental-ct-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
// Vite 8 publishes its types only through package.json `exports`, which TypeScript's
// `node` module resolution ignores, so the bare `vite` specifier has no types here.
import type { ResolvedConfig, Rolldown } from 'vite/dist/node/index';
import { createRequire } from 'node:module';

// The same `buffer` module instance the polyfill plugin aliases `buffer` to, so
// every import form resolves to one Buffer class.
const bufferPolyfillPath = createRequire(require.resolve('vite-plugin-node-polyfills')).resolve(
    'buffer-polyfill'
);

/**
 * Playwright Component Testing config for @tonkeeper/uikit.
 *
 * Tests are colocated next to components as `*.ct.tsx` files. They mount a real
 * React component in a real browser (via the Vite-backed CT runner) and assert
 * behaviour and/or pixel output (`toHaveScreenshot`).
 *
 * The CT runner uses its own Vite, which doesn't read the apps' postcss.config.
 * We wire Tailwind + autoprefixer here so the Tailwind stylesheet imported in
 * playwright/index.tsx (preflight, utilities, design-token :root vars) compiles
 * exactly as it does in the apps — otherwise Tailwind-styled components would
 * render unstyled in screenshots.
 *
 * Screenshots are platform-specific (the `{platform}` token below). Baselines
 * committed for CI are generated on Linux — see packages/uikit/UI_TESTING.md.
 */
export default defineConfig({
    testDir: './src',
    testMatch: /.*\.ct\.tsx$/,
    // Screenshots live next to the component they cover, in a `__screenshots__`
    // folder beside the test — e.g.
    //   src/components/fields/__screenshots__/Button.ct.tsx/button-primary.png
    // `{snapshotDir}` defaults to testDir (./src); `{testFileDir}` is relative to
    // it, so this resolves under src/ next to the test (without the prefix the
    // path drops `src/`). No platform suffix: baselines are generated and compared
    // on Linux only, so there is a single committed set. Other platforms skip
    // screenshot tests (see playwright/test.tsx), so no per-OS baselines are written.
    snapshotPathTemplate: '{snapshotDir}/{testFileDir}/__screenshots__/{testFileName}/{arg}{ext}',

    timeout: 30_000,
    fullyParallel: true,
    // Never let a committed `test.only` pass silently on CI.
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: process.env.CI ? 1 : undefined,
    // `terminalImageLinksReporter` prints screenshot expected/actual/diff images as
    // OSC 8 terminal hyperlinks (short label bound to a file:// URL) so they open on
    // click regardless of path length or the terminal's cwd.
    reporter: process.env.CI
        ? [['html', { open: 'never' }], ['list'], ['./playwright/terminalImageLinksReporter.ts']]
        : [['list'], ['./playwright/terminalImageLinksReporter.ts']],

    use: {
        // Dedicated dev-server port so it doesn't clash with app dev servers.
        ctPort: 3100,
        trace: 'on-first-retry',
        ctViteConfig: {
            // Polyfill Node globals (Buffer/process) for browser bundling. Several
            // shared modules — `@ton/core`'s BitString, AmountFormatter via
            // `hooks/balance` — touch `Buffer` at module-init time; without this
            // any test that mounts a component reaching those imports throws
            // "Buffer is not defined" before the first render.
            plugins: [
                nodePolyfills({
                    globals: { Buffer: true, global: true, process: true },
                    include: ['stream', 'buffer', 'crypto', 'util']
                }),
                {
                    // `vite-plugin-node-polyfills` aliases the bare `buffer` specifier to
                    // an absolute file path. Vite's alias matcher also treats `buffer/`
                    // (the trailing-slash form some deps use to reach the npm package
                    // instead of the Node builtin, e.g. `@keystonehq/bc-ur-registry`)
                    // as a prefix match, rewriting it to `…/index.js/`, which Rolldown
                    // refuses to load as a directory. Aliases returned from a later
                    // plugin's `config` hook are prepended, so this exact match wins.
                    name: 'ct-buffer-trailing-slash-alias',
                    config: () => ({
                        resolve: {
                            alias: [{ find: /^buffer\/$/, replacement: bufferPolyfillPath }]
                        }
                    })
                },
                {
                    // The CT runner force-merges `build.sourcemap: true` on top of
                    // this config (ct-core createConfig), so a plain `build` override
                    // here is ignored. Sourcemaps make Rolldown hold per-module map
                    // chains for the whole test bundle — a large share of the heap
                    // that OOMs the build as the suite grows — and nothing in a test
                    // run consumes them. Mutating the resolved config is the only
                    // hook that runs after Playwright's merge.
                    name: 'ct-drop-sourcemaps',
                    configResolved(config: ResolvedConfig) {
                        config.build.sourcemap = false;
                    }
                }
            ],
            build: {
                rolldownOptions: {
                    onwarn(warning: Rolldown.RolldownLog, warn: Rolldown.LoggingFunction) {
                        const isUnusedNodeStorageImport =
                            warning.plugin === 'vite:resolve' &&
                            (warning.message.includes(
                                'Module "fs" has been externalized for browser compatibility'
                            ) ||
                                warning.message.includes(
                                    'Module "fs/promises" has been externalized for browser compatibility'
                                ));
                        const isArkUiClientDirective =
                            warning.code === 'MODULE_LEVEL_DIRECTIVE' &&
                            warning.id?.includes('/@ark-ui/react/');

                        if (isUnusedNodeStorageImport || isArkUiClientDirective) return;
                        warn(warning);
                    }
                }
            },
            css: {
                postcss: {
                    plugins: [tailwindcss({ config: './tailwind.config.ts' }), autoprefixer()]
                }
            }
        }
    },

    expect: {
        toHaveScreenshot: {
            // Small tolerance to absorb sub-pixel antialiasing noise. The
            // same tolerance makes `--update-snapshots` skip baselines whose
            // change stays under it, so a sweeping-but-subtle change (e.g. a
            // font swap) leaves stale baselines behind. CT_UPDATE_ALL=1 zeroes
            // the tolerance so every changed pixel fails the comparison and
            // gets rewritten (see `test:ct:update:all:docker`).
            ...(process.env.CT_UPDATE_ALL
                ? { maxDiffPixels: 0, threshold: 0 }
                : { maxDiffPixelRatio: 0.01 }),
            animations: 'disabled',
            scale: 'css'
        }
    },

    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
