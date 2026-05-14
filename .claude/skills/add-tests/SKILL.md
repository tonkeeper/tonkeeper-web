---
name: add-tests
description: >-
  Use this skill whenever adding, modifying, or planning tests in the
  tonkeeper-web monorepo — whether porting items from the regression checklist,
  covering a new feature, locking in a bug-fix regression, or filling a gap in
  existing coverage. Encodes the tier decision tree (unit / integration /
  component-visual / e2e / manual), tells you where each tier lives, which
  tools to use, and the locked-in constraints from `tests/TESTING_PLAN.md`.

  Use even for "small" test additions — picking the wrong tier is the most
  common waste in this project, and the conventions below prevent re-litigating
  the same decisions every time.

  Do NOT use for: pure source-code refactors with no test changes, documentation
  edits, or reading existing tests to understand behaviour.
---

# Adding tests in tonkeeper-web

This skill is the working agreement for how tests are added in this monorepo.
The canonical, evolving source is `tests/TESTING_PLAN.md` — **read it first**
when in doubt; this skill is a quick-reference for the most common decisions.

## Step 0 — Read the plan

```bash
sed -n '1,40p' tests/TESTING_PLAN.md
```

The "Conventions", "Decisions", and "Suggested implementation order" sections
are the parts that change as the project evolves. If guidance here conflicts
with the plan, the plan wins — and update this skill so they re-converge.

## Step 1 — Pick the tier

Walk this tree explicitly in your reply before writing any test code. State
the tier you picked and why. If the answer is "it could be A or B", default to
the cheaper tier (unit < integration < component-visual < e2e).

1. **Is the behaviour a pure function?** (math, parser, formatter, address
   derivation, message builder, classifier, encoder/decoder)
   → **Unit** (`vitest`).
   - In `packages/core` if it's protocol/business logic (already configured).
   - In `packages/uikit` if it's UI-adjacent pure logic (vitest setup is being
     added — see plan step 1).
   - Pattern: table-driven, see
     `packages/core/src/utils/__tests__/AmountFormatter.test.ts`.

2. **Is it a component / hook / form / screen behaviour with mocked
   SDK/network/time?**
   → **Integration** (`vitest` + `jsdom` + `@testing-library/react`).
   - Lives in `packages/uikit` next to the component.
   - Mock `appSdk`, `Storage`, network, and time — never hit a real backend.
   - Assert behaviour, not pixels.

3. **Is the risk layout / spacing / theme / overflow / wrap, not behaviour?**
   → **Component visual** (`@playwright/experimental-ct-react`).
   - Lives in `packages/uikit/component-tests/`.
   - Snapshot under `tests/playwright/__screenshots__/`.
   - Chromium-only in CI to keep snapshots stable.
   - Skip components that depend on time, random, or live data — those go to
     integration.
   - First snapshot still needs a human to bless; the tier only catches
     *regressions*.

4. **Does it span router + multiple screens + state + multiple components?**
   → **E2E** (Playwright against `vite preview` of `apps/web`).
   - Lives in `tests/playwright/tests/`.
   - All network mocked via `page.route`; reusable fixtures in
     `tests/playwright/fixtures/`.
   - Uses the throwaway fixture seed; **never broadcasts**, never spends.
   - Selectors: prefer `data-testid`. Do not use locale-bound text or
     `nth(N)` chains — these are anti-patterns from the legacy suite.

5. **Does it require real funds, real third-party UI, real hardware, or
   real OS-level deeplinks?**
   → **Manual** — add a checklist entry, don't write code. The cost of
   automating it is higher than running it by hand once per release.

## Step 2 — Locked-in constraints (do not violate without discussion)

- **No TON testnet.** Testnet is unstable and not used. Mock all
  `tonapi` / `tonconsole` / `pro` / `battery` responses. Never propose
  testnet endpoints or testnet seeds in CI secrets.
- **Throwaway fixture seed.** A committed mnemonic in
  `tests/playwright/fixtures/seed.ts` (and equivalent for vitest fixtures).
  Tests work offline. No GitHub secret required for seeds.
- **No real broadcasts.** Sends/swaps/multisends go up to the confirm sheet,
  then a mocked broadcast response routes the app back to the main screen.
- **`data-testid` is gated by a stale-id CI check.** Every testid in source
  must be referenced by at least one test file. When you add a testid, claim
  it from a test in the same change. Do not add testids "for future use".
- **Mocks at the network layer, not at the app boundary.** Pro entitlement,
  battery balance, swap quotes, jetton list — all return through `page.route`
  fixtures or vitest fetch mocks. Do not add app-side dev-mode bypass flags
  for tests.
- **Build order before running tests against built apps**: rebuild `core`
  then `uikit` before any e2e that exercises `apps/web` from `dist`. (Apps
  import from the built packages, not source.)

## Step 3 — Write the test

- Read the closest existing test of the same tier as a template before
  writing a new file. Match its style.
- Keep tests deterministic: pin time (`vi.useFakeTimers()`), seed any RNG,
  avoid `Math.random`, avoid `Date.now()` in assertions.
- One behaviour per test. Table-driven for parametric pure functions.
- If you add a `data-testid` in source: in the **same** change, reference it
  from at least one test, or the stale-id check will fail CI.

## Step 4 — Run the affected tier locally

```bash
# Unit/integration in core
yarn workspace @tonkeeper/core test

# Unit/integration in uikit (once setup lands)
yarn workspace @tonkeeper/uikit test

# Component visual (once setup lands)
yarn workspace @tonkeeper/uikit test:ct

# E2E (existing workspace name, may be renamed)
yarn workspace @tonkeeper/playwrite test
```

Do not run the full monorepo test suite unless explicitly asked — it's slow
and the per-workspace command is sufficient for the change at hand.

## Step 5 — Reverse decision tree (when NOT to write a test)

- Documentation / comment-only change.
- Pure rename / formatting with no behaviour change and green existing tests.
- A behaviour that is impossible to test without real funds / hardware /
  live third-party UI → add a **manual** checklist entry instead. Do not
  write a flaky test that pretends to cover it.
- A behaviour already covered at a higher tier where the lower-tier test
  would just duplicate. Pick one, not both.

## Step 6 — When the guidance is wrong

This skill is adjusted on the go. If you discover a constraint that should
outlast the conversation, or a new tier-decision rule that wasn't covered:

1. Update this `SKILL.md` in the same PR.
2. Update `tests/TESTING_PLAN.md` if the change affects the plan.
3. If it's a user-preference style guidance ("we always do X this way"),
   save it as a feedback memory in addition to the file change.

## Quick reference: file locations

| Tier | Test location | Tooling |
|---|---|---|
| Unit (protocol) | `packages/core/src/**/__tests__/*.test.ts` | vitest |
| Unit/integration (UI) | `packages/uikit/src/**/__tests__/*.test.{ts,tsx}` | vitest + jsdom + RTL |
| Component visual | `packages/uikit/component-tests/*.spec.tsx` | `@playwright/experimental-ct-react` |
| E2E | `tests/playwright/tests/**/*.spec.ts` | Playwright |
| Manual | regression checklist (Russian source / English `TESTING_PLAN.md`) | — |

| Fixture | Location | Purpose |
|---|---|---|
| Throwaway seed | `tests/playwright/fixtures/seed.ts` | Address derivation only, no broadcast |
| Route mocks | `tests/playwright/fixtures/routes/*.ts` | `page.route` response library, installed per spec |
| Storage state | `tests/playwright/fixtures/auth.json` | Pre-imported wallet, skips welcome flow |

| Anti-pattern | Replacement |
|---|---|
| `page.locator('text=Send')` (locale-bound) | `data-testid="send-button"` |
| `page.locator('div').nth(3)` | named testid |
| Real seed in CI secret | committed fixture seed + mocked network |
| Real on-chain broadcast | `page.route` returning mocked broadcast response |
| `setTimeout` / `waitForTimeout` | `expect.poll` or `waitFor` with a real condition |
