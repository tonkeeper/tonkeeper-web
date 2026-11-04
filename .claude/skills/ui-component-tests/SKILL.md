---
name: ui-component-tests
description:
    Write or update Playwright component (UI) tests for @tonkeeper/uikit React components —
    colocated *.ct.tsx files with desktop/mobile screenshot + behaviour assertions. Use when adding
    a small/medium uikit component, when asked to add a UI/component/screenshot test, or when
    screenshot baselines need regenerating.
---

# UI component tests (Playwright CT) for @tonkeeper/uikit

Component tests mount a real React component in a real browser. Use them for **small-to-medium uikit
components** (buttons, fields, list rows, badges, cards). Page-level flows belong in the end-to-end
suite, not here.

Full reference: `packages/uikit/UI_TESTING.md`. Read it if anything below is unclear.

## Conventions (do not deviate)

-   Tests are **colocated** with the component and named `Foo.ct.tsx` (next to `Foo.tsx`). The
    `*.ct.tsx` suffix keeps them separate from future `*.test.ts` unit tests.
-   Import the test API from the shared harness, NOT from `@playwright/...` directly:
    `import { expect, screenshotEachMode, test } from '<relative>/playwright/test';` (from
    `src/components/fields/` the path is `../../../playwright/test`).
-   Every mounted component is auto-wrapped in the styled-components `ThemeProvider` + `GlobalStyle`
    by `packages/uikit/playwright/index.tsx`. Components that use `useTheme()` just work. If a
    component needs more providers (i18n / react-query / router), add them in that `beforeMount`
    hook — don't wrap inside the test.
-   **Tailwind** is loaded too (preflight + utilities + design-token vars) and compiled via
    `ctViteConfig` in `playwright-ct.config.ts`, so Tailwind utility classes render in tests.

## Pattern

```tsx
import { Foo } from './Foo';
import { expect, screenshot, test } from '../../../playwright/test';

// Default: ONE screenshot per state. Use this for the vast majority of components.
screenshot('Foo default', () => <Foo />);
screenshot('Foo active', () => <Foo active />);

// Behaviour assertions (real browser):
test('Foo fires onChange', async ({ mount }) => {
    let value = '';
    const c = await mount(<Foo onChange={v => (value = v)} />);
    await c.getByRole('textbox').fill('hi');
    expect(value).toBe('hi');
});
```

`screenshot(title, render, mode?)` renders once (desktop by default). **Do not** reach for
desktop+mobile by default — most components have no breakpoint-dependent layout. Only when a
component has CSS media queries / responsive layout, use the opt-in decorator
`screenshotEachMode(title, render, modes?)`, which snapshots both desktop (1280×800) and mobile
(390×844) with the matching theme variant.

## Commands

```sh
cd packages/uikit
yarn test:ct                 # run all
yarn test:ct:changed         # only tests affected by the current diff (also used on PR CI)
yarn test:ct:update          # regenerate baselines (Linux only; see below)
yarn test:ct --ui            # debug: interactive UI mode
yarn test:ct --debug -g "X"  # debug: step through tests matching "X"
```

Debugging flags (`--ui`, `--debug`, `--headed`, `-g <title>`, `npx playwright show-report`,
`show-trace`) are documented in `UI_TESTING.md` → "Debugging locally".

Prereqs: `yarn build:pkg` (root) once so `@tonkeeper/core` dist exists; and
`npx playwright install chromium` once.

## Screenshot baselines — important

-   **One baseline per screenshot**, no platform suffix. Committed **next to the component**, in a
    `__screenshots__/` folder beside the test (e.g.
    `src/components/fields/__screenshots__/Button.ct.tsx/button-primary.png`) — never a central dir.
-   **Screenshots run on Linux only.** On macOS/Windows they're auto-skipped (so you can't generate
    or clobber a baseline locally); behavioural `test(...)` blocks still run. A new screenshot test
    is RED on CI until its baseline is committed.
-   To create/update baselines, regenerate on Linux: trigger the **Component Tests → "Update
    screenshot baselines"** GitHub Action (`workflow_dispatch`, authoritative — matches CI), or run
    the pinned Playwright Docker image locally (command in `UI_TESTING.md`).

Do NOT loosen the `maxDiffPixelRatio` tolerance to force a flaky screenshot to pass — regenerate the
baseline instead.
