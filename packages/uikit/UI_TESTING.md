# UI component tests

We test React components with [Playwright Component Testing]
(https://playwright.dev/docs/test-components) (`@playwright/experimental-ct-react`). A component
test mounts a real component in a real browser, so it can assert both **behaviour** (clicks,
disabled state, text) and **appearance** (screenshots).

> **Plan / direction:** we're rolling these out **alongside the unit tests**, targeting
> **small-to-medium components** (buttons, fields, list rows, badges, cards…). Large page-level
> flows stay in the end-to-end suite. New small/medium components should ship with a component test.
> Each test can render in **desktop and mobile modes** via a decorator (see below) so we catch
> responsive regressions.

## Layout

```
packages/uikit/
  playwright-ct.config.ts        # CT runner config
  playwright/
    index.html                   # mount page
    index.tsx                    # beforeMount: wraps every component in ThemeProvider + GlobalStyle
    test.tsx                     # extended `test`/`expect`, TEST_MODES, screenshotEachMode()
  src/components/fields/
    Button.tsx                   # the component
    Button.ct.tsx                # its test — lives next to the component
    __screenshots__/             # baselines, next to the component they cover
      Button.ct.tsx/
        button-primary.png
```

Tests are colocated with their component and named `*.ct.tsx` (kept separate from any future
`*.test.ts` unit tests so the two runners never collide). Screenshot baselines sit in a
`__screenshots__/` folder **beside the test**, not in one central directory.

## Running

```sh
# from packages/uikit
yarn test:ct                 # run all component tests
yarn test:ct -- --ui         # interactive UI mode
yarn test:ct:update          # (re)generate screenshot baselines (Linux only — see below)
yarn test:ct:changed         # only tests affected by your current diff

# from the repo root
yarn workspace @tonkeeper/uikit test:ct
yarn workspace @tonkeeper/uikit test:ct:changed
```

First run requires the browser once: `cd packages/uikit && npx playwright install chromium`. Shared
packages must be built first (`yarn build:pkg` from the root) — uikit imports `@tonkeeper/core` from
`dist/`.

## Writing a test

```tsx
import { Button } from './Button';
import { expect, screenshot, test } from '../../../playwright/test';

// Default: one screenshot. Most components have no breakpoint-dependent layout,
// so a single render is all you need.
screenshot('Button primary', () => <Button primary>Send</Button>);

// Plain behaviour test — it's a real browser, so interactions work.
test('Button forwards onClick', async ({ mount }) => {
    let clicked = false;
    const c = await mount(
        <Button primary onClick={() => (clicked = true)}>
            Send
        </Button>
    );
    await c.click();
    expect(clicked).toBe(true);
});
```

### Desktop / mobile (only when responsive)

`screenshot(title, render, mode?)` is the default — a single snapshot, in `desktop` mode unless you
pass `'mobile'`.

**Only** components whose layout actually changes across breakpoints (CSS media queries) need both
modes. For those, use the opt-in decorator `screenshotEachMode(title, render, modes?)`, which
generates `"<title> [desktop]"` and `"<title> [mobile]"`:

```tsx
import { screenshotEachMode } from '../../../playwright/test';

screenshotEachMode('Header', () => <Header />); // both modes
screenshotEachMode('Header', () => <Header />, ['mobile']); // restrict to a subset
```

Both helpers accept an `interact` option that runs after mount and before the snapshot — for states
only reachable through interaction (an opened tooltip, a toggled row):

```tsx
screenshot('Hint bubble', () => <Hint label="Fee" text="…" />, 'desktop', {
    interact: async component => {
        const trigger = component.getByRole('button', { name: 'Fee' });
        await trigger.focus();
        await trigger.press('Enter');
        await expect(component.getByRole('tooltip')).toBeVisible();
    }
});
```

A "mode" sets two things:

| Mode      | Viewport   | Theme (`proDisplayType`) |
| --------- | ---------- | ------------------------ |
| `desktop` | 1280 × 800 | `desktop`                |
| `mobile`  | 390 × 844  | `mobile`                 |

The viewport is applied test-side; the theme variant is applied in `playwright/index.tsx`'s
`beforeMount` hook (which reads `hooksConfig.mode`). To wire a mode manually in a custom test:
`await mount(<C/>, { hooksConfig: { mode: 'mobile' } })` and
`await page.setViewportSize(TEST_MODES.mobile)`.

When a component needs more providers (i18n, react-query, router), add them in
`playwright/index.tsx` so every test gets them.

### Styling: styled-components + Tailwind

The harness loads **both** styling systems the apps use, so components render like production:

-   styled-components theme + `GlobalStyle` (via the `ThemeProvider` in `beforeMount`);
-   Tailwind — `src/styles/tailwind.css` (preflight, utilities, and the design-token `:root` vars)
    is imported in `playwright/index.tsx` and compiled by the Tailwind PostCSS plugin wired into
    `playwright-ct.config.ts` (`ctViteConfig`, since the CT runner's Vite doesn't read the apps'
    `postcss.config`). Tailwind utility classes (`bg-textPrimary`, `rounded-small`, …) work in
    tests. There's a single dark theme, so the static `:root` vars match `defaultTheme` and no
    runtime var sync is needed. Changing token values in `tailwind.css` will shift screenshots →
    regenerate baselines.

## Screenshots and CI

There is **one** baseline per screenshot (no platform suffix), generated on **Linux**. Font
rendering differs across OSes, so rather than keep a baseline per platform, **screenshot tests only
run on Linux** — on macOS/Windows they're skipped (you'll see `skipped` in the output). Behavioural
`test(...)` blocks still run everywhere. This keeps a single committed source of truth and means a
local `yarn test:ct` on your Mac can never accidentally write or clobber a baseline.

> **Heads-up — local runs can OOM.** Even a single-file, behaviour-only `yarn test:ct` first has
> Vite bundle the _entire_ component registry (wallet-core, ark-ui, …) for the browser, regardless
> of the file filter. On macOS this can exhaust the Node heap and crash with a V8 OOM **before any
> test runs** — bumping `--max-old-space-size` doesn't reliably help. Prefer the **Docker path**
> below (or the CI workflow) to run the suite. `tsc` builds and `eslint` are unaffected — run those
> locally to validate a change before handing the tests off.

**CI runs inside the pinned Playwright Docker image** (`mcr.microsoft.com/playwright:v1.62.1-jammy`)
— both the verify job and the snapshot-update job use it. That image is the rendering environment
baselines are generated against. Keep the image tag in sync with the `@playwright/*` version in
`package.json`.

After you add or intentionally change a component's look, regenerate the baseline **on Linux**. Two
ways:

1. **GitHub Actions (recommended, authoritative).** Run the **Component Tests → "Update screenshot
   baselines"** workflow (`workflow_dispatch`). It regenerates in the CI container and commits the
   updated baselines to your branch — guaranteed to match what the verify job compares against.
2. **Locally via Docker.** Run the wrapper script — it spins up the pinned Playwright image,
   installs, clears the CT cache (a host-populated `playwright/.cache` holds paths that don't
   resolve in the container) and updates baselines inside Linux:

    ```sh
    # from packages/uikit
    yarn test:ct:update:docker     # regenerate all baselines in the pinned Linux container
    yarn test:ct:docker            # run the whole suite (incl. screenshots) in the container

    # Scope to a file, a folder, or several of either — paths/flags pass straight through:
    yarn test:ct:docker src/components/fields/Button.ct.tsx
    yarn test:ct:docker src/components/onramp
    yarn test:ct:update:docker src/components/onramp src/components/fields/Button.ct.tsx
    ```

    It uses your machine's native arch (no `--platform linux/amd64` — emulated esbuild can crash on
    Apple Silicon). The raw `docker run …` it wraps lives in `package.json`. Locally-generated
    baselines use your container's CPU arch; CI is amd64. Rendering is normally identical across
    arch for the same image, but if the verify job ever disagrees, treat the Action (option 1) as
    the source of truth.

    Two things the script handles / you should know:

    - **GitHub Packages auth.** `@tonkeeper/chainkit` is fetched from `npm.pkg.github.com`, so the
      container needs an auth token. Export `NODE_AUTH_TOKEN`, `YARN_NPM_AUTH_TOKEN`, or
      `GITHUB_TOKEN` before running the script; the wrapper forwards it into Docker as both
      `NODE_AUTH_TOKEN` and `YARN_NPM_AUTH_TOKEN` for Yarn.
    - **It shares your `node_modules`.** The repo (incl. `node_modules`) is bind-mounted, so the
      container's install rebuilds native modules (`esbuild`, `sharp`, …) as **Linux** binaries in
      place. After running, your macOS host deps are Linux ones — **run `yarn install` on the host
      to restore them** before `yarn dev`/builds. Prefer option 1 (the Action) if you want zero
      local side effects.

CI behaviour (`.github/workflows/component-tests.yaml`):

-   **Pull request** → runs only the tests affected by the diff (`test:ct:changed`).
-   **Push to `main`** → runs the full suite.
-   On failure it uploads the Playwright HTML report (with expected/actual/diff images).

A test fails if its baseline is missing, so a new screenshot test is red on CI until its baseline is
committed (step 1 or 2 above).

## Debugging locally

Pass Playwright flags straight through the script (`yarn test:ct <flags>`), all from
`packages/uikit`:

```sh
yarn test:ct --ui                       # interactive UI: pick tests, watch, time-travel
yarn test:ct --debug                    # step through with the Playwright Inspector
yarn test:ct --headed                   # watch the real browser as it runs
yarn test:ct -g "Button primary"        # run tests matching a title substring
yarn test:ct src/components/fields/Button.ct.tsx   # a single file
yarn test:ct --headed --workers=1       # serial + visible, easiest to follow

# Screenshots
yarn test:ct:update                     # refresh baselines for YOUR platform (local scratch)
yarn test:ct:update -g "Button"         # ...only matching tests

# After a run
npx playwright show-report              # open the HTML report (expected/actual/diff)
npx playwright show-trace test-results/<dir>/trace.zip   # trace from a failed retry
```

`page.pause()` inside a test opens the Inspector at that point when run with `--headed`/`--debug`. A
failing screenshot's expected/actual/diff images are in `test-results/` and in the HTML report.
Remember a local screenshot diff may just mean your platform differs from the committed `-linux`
baseline — confirm appearance, then regenerate the baseline via the container, don't loosen the
tolerance.
