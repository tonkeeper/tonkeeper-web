import { defineConfig, devices } from '@playwright/experimental-ct-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

/**
 * Component tests are colocated with the components as `*.ct.tsx`. The CT
 * runner uses its own Vite, so Tailwind is wired here for the stylesheet
 * playwright/index.tsx imports.
 *
 * Screenshot baselines are generated and compared on Linux only (CI and the
 * pinned Playwright container); other platforms skip screenshot tests.
 */
export default defineConfig({
    testDir: './src',
    testMatch: /.*\.ct\.tsx$/,
    snapshotPathTemplate: '{snapshotDir}/{testFileDir}/__screenshots__/{testFileName}/{arg}{ext}',
    globalSetup: './playwright/fontSetup.ts',

    timeout: 30_000,
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: process.env.CI
        ? [['html', { open: 'never' }], ['list'], ['./playwright/terminalImageLinksReporter.ts']]
        : [['list'], ['./playwright/terminalImageLinksReporter.ts']],

    use: {
        ctPort: 3110,
        trace: 'on-first-retry',
        ctViteConfig: {
            css: {
                postcss: {
                    plugins: [tailwindcss({ config: './tailwind-ct.config.ts' }), autoprefixer()]
                }
            }
        }
    },

    expect: {
        toHaveScreenshot: {
            // CT_UPDATE_ALL=1 zeroes the tolerance so `--update-snapshots`
            // rewrites baselines whose change would otherwise sit under it.
            ...(process.env.CT_UPDATE_ALL
                ? { maxDiffPixels: 0, threshold: 0 }
                : { maxDiffPixelRatio: 0.01 }),
            animations: 'disabled',
            scale: 'css'
        }
    },

    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
