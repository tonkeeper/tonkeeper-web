// This file MUST keep the `.tsx` extension (it holds no JSX). The `screenshot` /
// `screenshotEachMode` helpers below call Playwright's `test()`, so every screenshot
// test resolves its source location to this file. When a `*.ct.tsx` contains only
// screenshot tests, all of its tests point here; Playwright's loader then treats that
// as a source-map case and rewrites the file suite's location to this helper — but
// only when the extensions differ (`.ts` vs `.tsx`). Matching `.tsx` suppresses that
// rewrite, so path filters like `playwright test src/.../Foo.ct.tsx` keep working.
import { test as base, expect } from '@playwright/experimental-ct-react';
import { join } from 'node:path';
import type { Locator, Page } from 'playwright-core';
import type { TestMode } from './index';
import { FONT_BASE_URL, FONT_CACHE_DIR, FONT_FILES } from './fontAssets';

export { expect };
// globalSetup downloads the licensed font faces once. Serve those cached files
// to the localhost test page without changing the production origin allowlist.
const fontUrls = new Set(FONT_FILES.map(filename => new URL(filename, FONT_BASE_URL).href));

export const test = base.extend({
    page: async ({ page }, use) => {
        await page.route(
            url => fontUrls.has(url.href),
            async route => {
                const url = route.request().url();
                await route.fulfill({
                    path: join(FONT_CACHE_DIR, new URL(url).pathname.split('/').pop()!),
                    contentType: 'font/woff2',
                    headers: { 'access-control-allow-origin': '*' }
                });
            }
        );
        await use(page);
    }
});
export type { TestMode };
type ScreenshotTarget = 'component' | 'dialog' | 'page';
type ScreenshotOptions = {
    target?: ScreenshotTarget;
    setupPage?: (page: Page, mode: TestMode) => Promise<void> | void;
    /**
     * Runs after mount, before the snapshot — for states only reachable
     * through interaction (an opened tooltip, a toggled row, …).
     */
    interact?: (component: Locator, page: Page) => Promise<void>;
};

/** Viewport size per mode. Mirrors the breakpoints the app targets. */
export const TEST_MODES = {
    desktop: { width: 1280, height: 800 },
    mobile: { width: 390, height: 844 }
} as const satisfies Record<TestMode, { width: number; height: number }>;

const slug = (title: string) =>
    title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

// We keep a single committed baseline set, generated on Linux (CI / the pinned
// container). On any other OS, font rendering differs, so screenshot tests are
// skipped rather than producing per-platform baselines. Behaviour assertions in
// plain `test(...)` blocks still run everywhere.
const SCREENSHOTS_SUPPORTED = process.platform === 'linux';
const SKIP_REASON = 'Screenshots run on Linux only (CI / the pinned container); skipped here.';

/**
 * Default screenshot test: render `render()` once and snapshot it.
 *
 *   screenshot('Button primary', () => <Button primary>Send</Button>);
 *
 * This is what most components want — a component without breakpoint-dependent
 * styling looks the same at any width, so one screenshot is enough. Renders in
 * `desktop` mode by default; pass a `mode` only if a component needs the mobile
 * theme variant. For components whose *layout* changes across breakpoints (CSS
 * media queries), use `screenshotEachMode` instead.
 */
export function screenshot(
    title: string,
    render: () => JSX.Element,
    mode: TestMode = 'desktop',
    options: Pick<ScreenshotOptions, 'interact' | 'setupPage'> = {}
) {
    test(title, async ({ mount, page }) => {
        test.skip(!SCREENSHOTS_SUPPORTED, SKIP_REASON);
        await page.setViewportSize(TEST_MODES[mode]);
        if (options.setupPage) {
            await options.setupPage(page, mode);
        }
        const component = await mount(render(), { hooksConfig: { mode } });
        if (options.interact) {
            await options.interact(component, page);
        }
        await expect(component).toHaveScreenshot(`${slug(title)}.png`);
    });
}

/**
 * Opt-in decorator for **responsive** components: snapshot `render()` in both
 * desktop and mobile modes. Use only when the component has media queries /
 * breakpoint-dependent layout — most components don't and should use
 * `screenshot` above.
 *
 * Generates two tests — `"<title> [desktop]"` and `"<title> [mobile]"`. Each
 * sets the matching viewport and passes `mode` into the mount harness, which
 * sets the matching kit layout (see playwright/index.tsx).
 *
 *   screenshotEachMode('Header', () => <Header />);
 *
 * Pass a subset of modes as the third argument to restrict, e.g. `['mobile']`.
 */
export function screenshotEachMode(
    title: string,
    render: () => JSX.Element,
    modes: readonly TestMode[] = ['desktop', 'mobile'],
    options: ScreenshotOptions = {}
) {
    const target = options.target ?? 'component';
    const setupPage = options.setupPage;
    for (const mode of modes) {
        test(`${title} [${mode}]`, async ({ mount, page }) => {
            test.skip(!SCREENSHOTS_SUPPORTED, SKIP_REASON);
            await page.setViewportSize(TEST_MODES[mode]);
            if (setupPage) {
                await setupPage(page, mode);
            }
            const component = await mount(render(), { hooksConfig: { mode } });
            if (options.interact) {
                await options.interact(component, page);
            }
            const screenshotTarget =
                target === 'dialog'
                    ? page.getByRole('dialog').first()
                    : target === 'page'
                    ? page
                    : component;
            await expect(screenshotTarget).toHaveScreenshot(`${slug(title)}-${mode}.png`);
        });
    }
}
