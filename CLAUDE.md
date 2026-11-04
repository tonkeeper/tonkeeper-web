# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository.

## Repository overview

Yarn 4 monorepo with Turborepo for a non-custodial TON blockchain wallet. Shared packages feed the
platform apps:

-   **`packages/core`** — business logic, API clients, crypto services, account model (no React)
-   **`packages/uikit`** — all React components, state hooks, pages (depends on core)
-   **`packages/locales`** — i18n translation files
-   **`apps/web`** — Vite SPA
-   **`apps/extension`** — Chrome/Firefox browser extension (MV2 for Firefox, MV3 for Chrome)
-   **`apps/desktop`** — Electron app via `electron-forge`
-   **`apps/twa`** — Telegram Mini App (Vite)
-   **`apps/mobile`** — Capacitor iPad app (Vite)

## Project context: redesign rebuild

The app is being rebuilt almost end-to-end against new Figma mockups. Treat the existing codebase as
**outdated reference material, not a source of truth**:

-   **Mockups are canonical.** When the mockup and the current code disagree, the mockup wins —
    every time. Do not propagate current visuals, props, layouts, or behaviour into new code on the
    grounds that "this is how the app does it today." The current behaviour is precisely what is
    being replaced.
-   **Designs are fetched via the Figma MCP.** When the user shares a Figma URL, use the Figma MCP
    tools (`get_design_context`, `get_screenshot`, `get_metadata`, …) to pull the spec rather than
    inferring intent from prose. Load the `/figma-use` skill before any `use_figma` write call.
-   **New screens build against `packages/uikit/src/primitives/`, in Tailwind only** — see "Styling"
    and "UI primitives vs legacy components" below for the rules.
-   **Folder structure and file names in `primitives/` are not load-bearing.** The current names
    were inherited from the legacy tree and are often misleading. If a name or location is awkward
    for the new design system, rename or move the file — don't work around it. Update imports as
    part of the same change.

## Comments

Comments describe behavior that exists, not the change that produced it. A reader six months from
now sees only the current code, and the comment must make sense to them.

-   **No process or change metadata.** No "added in", "moved from", "was previously", "renamed
    from", "TODO: revisit next sprint", phase / track / milestone references, internal plan names,
    Figma node IDs, ticket numbers, or PR links. This information belongs in commit messages and PR
    descriptions, not in the source tree.
-   **No "WHAT" comments.** Don't restate what well-named code already says. Names and types are the
    primary documentation; comments are for what names cannot express.
-   **WHY only, and only when non-obvious.** Keep a comment when it captures a hidden invariant, a
    subtle constraint, an external requirement, or a workaround for a specific bug. If the code
    reads cleanly without it, drop it.
-   **Default to no comment.** Prefer renaming or restructuring code over annotating it.

## Common commands

```sh
# Install dependencies
yarn

# Development (web only)
yarn dev:web

# Build a specific app
yarn build:web
yarn build:extension
yarn build:desktop
yarn build:twa

# Build shared packages only (required before building apps manually)
npx turbo build:pkg

# Unit tests (run from packages/core)
yarn workspace @tonkeeper/core test

# Run a single test file
yarn workspace @tonkeeper/core test src/utils/__tests__/AmountFormatter.test.ts

# UI component tests (Playwright CT, run from packages/uikit)
yarn workspace @tonkeeper/uikit test:ct            # all component tests
yarn workspace @tonkeeper/uikit test:ct:changed    # only tests affected by the diff

# Playwright E2E tests (run from tests/playwright)
yarn workspace @tonkeeper/playwrite test

# Lint
yarn eslint --ext .ts,.tsx .
```

**Build outputs:**

-   `apps/web/dist` — web app
-   `apps/extension/dist/chrome` and `dist/firefox` — extensions
-   `apps/desktop/out` — desktop application
-   `packages/*/dist` — compiled package artifacts

## Architecture: platform abstraction via `AppSdk`

Every platform app creates its own class that extends `BaseApp` and implements `IAppSdk` (defined in
`packages/core/src/AppSdk.ts`). This is the central abstraction: it holds the `IStorage` instance,
emits `UIEvents` (unlock, transfer, scan, toast, etc.), and provides platform-specific methods
(clipboard, open URL, biometry, keychain, cookie cleanup, etc.).

`uikit` hooks access the SDK via `useAppSdk()` — never import platform-specific implementations from
apps into `uikit`.

**Desktop:** `DesktopAppSdk` proxies all storage and system calls over Electron IPC to the main
process (`apps/desktop/src/electron/background.ts`), using a `sendBackground()` bridge.
Mnemonic/keys are stored in the OS keychain via `keytar`.

**Extension:** The extension has three contexts — popup (React UI), background service worker, and
content script. The background handles DApp connections and message routing between contexts using
`webextension-polyfill`.

## Architecture: storage

`IStorage` (defined in `packages/core/src/Storage.ts`) is a simple async key/value interface:

```ts
get<R>(key: string): Promise<R | null>
set<R>(key: string, value: R): Promise<R | null>
delete<R>(key: string): Promise<R | null>
clear(): Promise<void>
```

All storage keys are centralized in `packages/core/src/Keys.ts` under the `AppKey` enum. Never use
raw string keys.

## Architecture: state management

-   **Server/async state** — `@tanstack/react-query` (pinned to `4.3.4`). All cache keys are defined
    in `packages/uikit/src/libs/queryKey.ts` as the `QueryKey` enum. Use `anyOfKeysParts(...keys)`
    for broad invalidations.
-   **Reactive SDK state** — custom `Atom`, `Subject`, and `ReplaySubject` classes in
    `packages/core/src/entries/atom.ts`. The `AppSdk` holds atoms for active wallet, active account,
    lock state, etc.
-   **UI context** — `AppContext` (from `packages/uikit/src/hooks/appContext.ts`) provides API
    config, feature flags (`standalone`, `extension`, `ios`, `proFeatures`, `hideLedger`, etc.), and
    the analytics tracker. Populated by each app's root component.

## Architecture: account model

Defined in `packages/core/src/entries/account.ts`. The union type `Account` covers:

| Class                 | Description                            |
| --------------------- | -------------------------------------- |
| `AccountTonMnemonic`  | Standard mnemonic wallet (mainnet)     |
| `AccountTonTestnet`   | Testnet mnemonic wallet                |
| `AccountTonSK`        | Secret-key based wallet                |
| `AccountMAM`          | Multi-account mnemonic (HD derivation) |
| `AccountLedger`       | Ledger hardware wallet                 |
| `AccountKeystone`     | Keystone hardware wallet               |
| `AccountTonWatchOnly` | Watch-only, no signing                 |
| `AccountTonOnly`      | Address-only, no mnemonic              |
| `AccountTonMultisig`  | Multisig contract account              |

Each account has one or more `TonWalletStandard` entries (wallet versions V3R1–V5R1). The
`activeAccountId` and per-account `activeTonWalletId` are stored under `AppKey.ACTIVE_ACCOUNT_ID`
and `AppKey.ACCOUNT_CONFIG`.

`AccountMultichain` is the BIP39 multichain account (TON + EVM + BTC + TRON wallets behind one
seed). It is gated behind the `MULTICHAIN_ENABLED` flag — see below.

## Styling

Two styling systems live side-by-side during the multichain redesign:

-   **Tailwind** — `packages/uikit/tailwind.config.ts`, entry at
    `packages/uikit/src/styles/tailwind.css`. Design tokens (`backgroundPage`, `textPrimary`,
    `separatorCommon`, the `corner*` / `rounding*` scale, the button colors, etc.) are exposed as
    Tailwind colors that resolve to CSS custom properties (`var(--tk-…)`). Use the `cn(...)` helper
    from `packages/uikit/src/libs/css.ts` for conditional class lists.
-   **styled-components** — the legacy system. Still in use for everything that hasn't been touched
    by the redesign.

### Rules for new code

1.  **New components ship in Tailwind only.** Do not introduce `styled.div` / `createGlobalStyle` /
    template-literal CSS in any component created during or after the multichain-redesign work. This
    includes layout primitives, page chrome, form controls, and one-off page wrappers.
2.  **Touched legacy components port to Tailwind in the same PR.** If a new task lands changes in an
    existing styled-components component, convert it to Tailwind as part of the same PR rather than
    leaving a hybrid. Tokens map 1:1 to the Tailwind color names — there's no design-tradeoff cost.
3.  **Untouched legacy components stay as they are.** Don't open mass drive-by conversions; the
    migration is opportunistic, page by page.
4.  **The `theme` object remains canonical at runtime** — `UserThemeProvider` keeps writing into the
    styled-components theme and `syncThemeToTailwindVars` mirrors it into the CSS custom properties
    Tailwind reads, so the two systems share one source of truth.

Conditional styling goes through `cn(base, condition && 'class', other && 'class')`; the local `cn`
accepts `string | undefined | boolean` (no arrays — pass each condition as its own argument).

## UI primitives vs legacy components

Two component layers coexist:

-   **`packages/uikit/src/primitives/`** — the new design-system components (Button, Input, Loader,
    Toast, IconButton, Checkbox, Radio, Switch, AddRemoveButton, SearchField, FieldWord, TextArea,
    Link). **100% Figma-faithful, nothing else.** No adaptive shell-dependent sizing, no legacy
    boolean props, no compatibility shims. New screens build against these only.
-   **`packages/uikit/src/components/`** — legacy components consumed by un-redesigned screens. Stay
    as they are. **Do not modify them when building new features**, and **do not extend the
    primitive's API to "help" legacy callers** — the primitive must not gain props or branches that
    Figma doesn't specify, even if a legacy file imports from `primitives/`.

### Concrete rules

1.  **A primitive prop or branch must trace to a node in the Figma "Current Version" library.** If
    you can't point at the mockup, don't add it. "Preserving existing styled-components behavior" is
    NOT a valid justification — the pre-Figma code is itself legacy and may have invented its own
    rules (e.g. shell-dependent typography/corners on Button were a styled-components-era override,
    never in the design library; do not propagate them).
2.  **Legacy adapters at `components/fields/<Foo>.tsx` are allowed to wrap primitives** and add
    their own old-prop shims (e.g. `primary`/`secondary`/`warn` booleans, `bottom`/`marginTop`
    shorthands, polymorphic `as`). Those props live in the adapter file only — never bubble them
    into the primitive.
3.  **The primitives folder is flat**: one component per file (`primitives/Button.tsx`,
    `primitives/Button.ct.tsx`, …). Internal building blocks (`InputBlock`, `InputField`, etc.) can
    be exported from the same file but are not re-exported from `primitives/index.ts`.
4.  **Showcase**: `packages/uikit/src/pages/showcase/UiShowcase.tsx` is the temporary catalogue of
    every primitive in its key variants. Wired into `apps/web` at `/ui-showcase` behind
    `import.meta.env.DEV`. Use it to eyeball changes — and to confirm a new variant is in the mockup
    before adding it.

## Multichain feature gate

Single source of truth: **`packages/core/src/multichain.ts`** exports `MULTICHAIN_ENABLED`. Every
app shell reads it once at boot and feeds the value to `AppContext.multichainEnabled`. No env vars,
no per-app copies, no runtime override.

**`true` is the only supported value.** Production ships `true`; there is no planned `false`
release. `false` survives only as a dev-time convenience for diffing against pre-multichain
behaviour and is slated for removal together with every branch that reads it. Everything — including
the whole legacy-account experience — must work correctly with the flag on; "it's fine because we
can flip the flag off" is never a valid justification. Don't remove the flag or its branches yet,
but treat `true` as the only state that gets tested.

### Scope of the flag: creation only, not runtime behaviour

The flag has one job: **decide what type of account a brand-new wallet creation produces.** Past
that single fork, behaviour follows the account that's already on disk, not the flag.

-   **Create flow** — `multichainEnabled` is the gate. `true` → BIP39 mnemonic, `AccountMultichain`.
    `false` → TON mnemonic, `AccountTonMnemonic`. Same UI flow either way; the branch sits at
    "generate mnemonic" + "call the create-account hook."
-   **Import flow** — the imported mnemonic's shape decides the account type. TON-style mnemonic →
    `AccountTonMnemonic`. MAM mnemonic → `AccountMAM`. BIP39 → `AccountMultichain` if
    `multichainEnabled`, else `AccountTonMnemonic` (legacy behaviour). The flag participates only at
    the BIP39 fork in `ImportExistingWallet`.
-   **Every other add-wallet path is flag-independent** — MAM, multisig, Ledger, Keystone, Signer,
    watch-only, SK/Fireblocks and testnet stay fully available with the flag on and produce their
    legacy account types, exactly as on `main`. This matches both native apps. Only standard "Create
    new wallet" follows the flag.
-   **Everything else** — already-created wallets render and behave according to their **account
    type**, not the flag. `AccountMultichain` always shows multichain UI; `AccountTonMnemonic`
    always shows TON-only UI. Do not gate per-feature UI on `multichainEnabled` — that's a category
    error. Flipping the flag should not change how an existing wallet looks or works, only what the
    next created wallet looks like.

Legacy and multichain accounts coexist in one switcher, and the add-wallet entry points must stay
reachable from both homes.

Promoting a legacy account to multichain (e.g. "upgrade your TON wallet to multichain") is a
separate future feature, not part of the flag. Don't bake migration paths into flag branches.

### Forking style: copy-paste over conditionals

Because both flows ship from the same tree, components that diverge meaningfully between the
multichain and legacy paths should be **forked** — guard with an early return on the active
account's type and copy-paste the body into a sibling component, rather than threading
`if (isMultichain) …` through every section. The legacy branch then stays byte-identical to `main`,
and the multichain branch can evolve without one set of edits silently breaking the other.

A trivial branch — a string swap, an icon flip, a single outcome switched at the end of a flow — is
fine to inline. Example: `packages/uikit/src/pages/import/CreateStandardWallet.tsx` keeps one create
flow and reads `multichainEnabled` twice: once at "generate mnemonic" and once at "call the
create-account hook."

Reach for a full fork when the divergence spans more than a few lines or when the two versions touch
independent surfaces that could drift over time.

## Architecture: page layout

Every app shell renders its routes inside a single shared primitive:
**`packages/uikit/src/components/layout/AppLayout.tsx`**.

```tsx
<AppLayout
    sidebar={<AsideMenu />} // desktop only
    topBar={<Header />} // mobile only — optional
    bottomBar={<Footer standalone={standalone} />} // mobile only
    bare={!activeAccount || location.startsWith(AppRoute.import)}
    standalone={standalone}
>
    <Switch>…</Switch>
</AppLayout>
```

`AppLayout` branches once on `useIsFullWidthMode()` (`theme.displayType === 'full-width'`) and picks
one of three layouts:

-   **Desktop** (`full-width`) — two-column: `sidebar` slot on the left, content fills the rest.
    Figma `199:265572`.
-   **Mobile** (`compact`) — single column with the bars (`Header` / `Footer`) self-positioning via
    `position: fixed`. AppLayout reserves matching `padding-top: 64` / `padding-bottom: 80` (or `96`
    when `standalone`) on the content. Figma `4156:155023`.
-   **Bare** (`bare={true}`) — strips the chrome entirely. Used for onboarding (StartScreen),
    unlock, and the Ledger pairing screen. No sidebar, no bars, viewport-bound centered content.

Slots that don't apply to the current mode are ignored — every shell passes the same set of slots
once and the primitive picks. The `bare` predicate is the **single** place each shell decides "this
route has no chrome".

All shells use AppLayout except the mobile-capacitor `NarrowContent` (Ionic `IonApp` +
`IonReactRouter` + `IonMenu`) — Ionic owns the page lifecycle and the abstraction doesn't map;
Ionic-mode pages render `IonPage` / `IonContent` directly.

**Adding a new page:** declare your page as pure content. Do not wrap it in `Container`,
`FullSizeWrapper`, `min-h-[var(--app-height)]`, or similar — `AppLayout` owns sizing, centering, and
the viewport-bound height. If your page needs no chrome, route it through a `bare` branch in the
shell rather than building a one-off wrapper.

**Extension popup geometry:** the extension wraps `AppLayout` in a small `ExtensionPopupRoot` styled
div (`apps/extension/src/App.tsx`) that constrains the popup window to its `385px` min-width /
`600px` height. That outer constraint is genuinely browser-popup-specific and stays outside
`AppLayout`.

## Architecture: packages build pipeline

`packages/core` and `packages/uikit` compile via `tsc` only — no bundler. Imports between packages
use the compiled `dist/` output (e.g., `@tonkeeper/core/dist/entries/account`). When changing core
or uikit, run `yarn workspace @tonkeeper/core build` (or `build:pkg` via Turbo) before the consuming
app picks up the changes.

Turbo's task graph: `build:pkg` runs first, then all `build:*` app tasks depend on it.

## Verifying a change

**`npx turbo build:pkg` (tsc) + eslint is the whole verification budget by default.** Both are fast
and catch the mistakes that matter. Everything below is opt-in — do it only when the request says
so, and otherwise state what you did not verify rather than going and checking.

-   **Do not run test suites.** See "Testing" below.
-   **Do not drive the app in a browser** — no dev server, no Playwright/Chrome automation, no
    screenshots of the running app — unless explicitly asked. Reason from the mockup and the code
    instead. A round trip through a real wallet costs minutes per iteration and makes a ten-minute
    task an hour.

## Testing

-   **Do not run test suites locally.** Tests execute in CI, in Linux Docker containers — that is
    the only supported environment. Locally, Playwright CT runs out of memory and Vitest can fail on
    missing platform-native binaries; screenshot baselines exist only for Linux, so a local run
    can't validate them anyway. Write and update the tests, verify your change with
    `npx turbo build:pkg` (tsc) + eslint, and let CI execute the suites. A Docker-based local run is
    possible but only when explicitly requested.
-   **Unit tests** — Vitest in `packages/core` (`*.test.ts`), run in CI via
    `yarn workspace @tonkeeper/core test`.
-   **UI component tests** — Playwright Component Testing in `packages/uikit`, colocated as
    `*.ct.tsx`, targeting **small-to-medium components**; page-level flows stay in the E2E suite.
    New small/medium components ship with a `*.ct.tsx`. `screenshotEachMode` renders desktop +
    mobile variants; mount providers live in `packages/uikit/playwright/index.tsx`. Only the
    `-linux` screenshot baselines are committed (CI is Linux) — regenerate via the "Component Tests
    → Update screenshot baselines" workflow. Full guide: `packages/uikit/UI_TESTING.md`.
-   **E2E tests** — Playwright in `tests/playwright` (being phased out). The `qa/` layer inside it
    (`playwright.qa.config.ts`) is separate: agent-verification specs on the PR preview, see below.

## Agent pipeline

Linear tickets go through two saved workflows. Run them by name: "run tk-implement TK-1234", then
"run tk-verify TK-1234 plan" / "run".

-   **`tk-implement`** (`.claude/workflows/tk-implement.js`) — reads the ticket, stops if it has no
    acceptance criteria, writes QA cases from the spec only, codes in a separate git worktree that
    the workflow creates, runs `scripts/agent/gate.sh` (tsc + eslint on changed files), and retries
    at most 3 times (sonnet, sonnet, opus). Then `tk-reviewer` (`.claude/agents/`) reviews on a
    different model, with at most 2 fix rounds. It pushes, opens a draft PR and waits for CI. It
    never merges.
-   **`tk-verify`** — `plan` writes a QA plan for human approval; `run` executes it with Playwright
    on the PR preview (skill `tk-qa-verify-web`). This is the explicit opt-in for driving the app
    and running the `qa` Playwright project locally; the rules in "Verifying a change" and "Testing"
    still hold everywhere else.
-   **Labels** on the Linear issue: `risk:high` / `risk:low` (missing = high) and `visual`. A
    `visual` ticket waits for a human to check the preview and add the PR label `visual-ok` before
    `tk-verify` runs. Agents do not judge visuals.
-   **Test wallets**: A = multichain, B = legacy TON, C (optional) = empty battery that is never
    charged; seeds in the gitignored `tests/playwright/.env`. `.claude/hooks/guard-secrets.mjs`
    blocks agents from reading any `.env` but `.env.example`, the saved wallet profiles in
    `qa/.auth/` and seed variables in the environment. Signing happens only through `signPlanned()`
    for a transaction listed in an approved plan.
-   **Plans, reports, PR bodies and hand-offs are written in STE** (`.claude/skills/ste-writing`).
-   Linear comments are posted only after the user says yes.

## Adding translation keys

`packages/locales/src/<namespace>/<locale>.json` is the **single source of truth** for every
language — there is no external translation service in the loop. `task/build.ts` flattens those
files into the dist; non-English locales fall back to English via `fillMissingLocales`, so a missing
key degrades to English rather than throwing.

Write placeholders in their **final form** — `%{name}`, `{{name}}`, or `%1%`. The build does not
rewrite them, so these files say exactly what the app renders.

When you add a `t('new_key')` call:

1. Add the English entry to `packages/locales/src/tonkeeper-web/en.json` (or `tonkeeper/en.json` for
   keys shared with the mobile/iOS app). Both namespaces use the repo-standard **4-space JSON
   indent** and already satisfy `prettier`, so just write the file normally — the lint-staged
   prettier hook is a no-op on them and `--no-verify` is not needed. (`tonapi/` and `tonendpoint/`
   are still on 2-space and would be reformatted, but those are generated backend-message namespaces
   you don't hand-edit.)
2. **Add all 19 other locales in the same change — English-only is not acceptable to land.** Nothing
   outside the repo ever fills the gap, so an untranslated key stays English forever. Source the
   translations in this order:
    - **Copy from the native apps** when they have the same string. In the mobile repo: Android
      `android/apps/wallet/localization/src/main/res/values-<code>/strings.xml` (`in`→`id`, `iw` has
      no web counterpart, `zh`→`zh-Hans-CN`; convert `%1$s`-style placeholders to the web form and
      unescape `\'`), iOS
      `ios/LocalPackages/TKLocalize/Sources/TKLocalize/Resources/Locales/<code>.lproj/Localizable.strings`
      (convert `%@`). Prefer native copies — they are product-approved wording.
    - **Reuse an existing web translation** of the same string if one exists in either namespace
      (grep both `tonkeeper/` and `tonkeeper-web/` locale files).
    - **Generate the translation** for locales neither source covers, keeping terminology consistent
      with the locale file's existing strings (e.g. match how that locale already translates
      "Stake", "Swap", network names). `yarn lint:i18n` reports remaining locale gaps — it must show
      0 for the keys you added.

**Read the variable through `t()`, never off its return value.** `t('key', { name })` handles
`%{name}`, `{{name}}`, and `{name}` (see `tReplace` in `packages/uikit/src/hooks/translation.ts`)
and always merges the brand names. Hand-rolling `t('key').replace('%{name}', v)` binds the call site
to one exact placeholder spelling and fails silently — rendering the raw placeholder to the user —
the moment a translator writes it differently.

**Pick one namespace per key.** `task/build.ts` flattens `tonkeeper` and then `tonkeeper-web` into
one dict, so a key defined in both resolves to the `tonkeeper-web` value and the `tonkeeper` one is
silently discarded. Nested keys flatten with `_`, so a flat `start_screen_create_wallet_button` in
`tonkeeper-web` collides with `start_screen.create_wallet_button` in `tonkeeper`. The failure mode
is nasty: with only English in `tonkeeper-web`, every locale keeps resolving from `tonkeeper` and
looks fine — until someone adds translations to `tonkeeper-web/<locale>.json`, at which point the
English shadows the translated string everywhere. Before adding a key, check it isn't already
defined (flat **or** nested) in the other namespace; `yarn lint:i18n` will not catch this.

## Regenerating API clients

`packages/core` ships auto-generated clients for several Tonkeeper backends. Regeneration requires a
`GITHUB_TOKEN` with `Contents: Read` on the relevant private repo:

```sh
export GITHUB_TOKEN=<your-token>
yarn workspace @tonkeeper/core generate:tonkeeperApi   # tonendpoint_backend
yarn workspace @tonkeeper/core generate:2faApi          # tonkeeper_2fa_backend
yarn workspace @tonkeeper/core generate:batteryApi      # custodial-battery
yarn workspace @tonkeeper/core generate:pro             # pro_backend
yarn workspace @tonkeeper/core generate:tonConsoleApi   # tonconsole_backend
yarn workspace @tonkeeper/core generate:swapsApi        # swaps_backend_go (Swap/Onramp/Exchange/P2p)
yarn workspace @tonkeeper/core generate:sdkV2           # public, no token needed
```

`generate:swapsApi` pulls one `swagger.yaml` covering all of swap, exchange, onramp, offramp, p2p,
and crosschain operations, and emits `Swap`, `Onramp`, `Exchange`, and `P2p` API classes plus the
full model set. To regenerate against a feature branch instead of `main`, set
`SWAPS_BACKEND_BRANCH`:

```sh
SWAPS_BACKEND_BRANCH=multichain-ramps yarn workspace @tonkeeper/core generate:swapsApi
```

`generate:analytics` takes the same kind of override — `ANALYTICS_SCHEMAS_BRANCH` — for trying a
proposed event out in the client before its schema PR is merged:

```sh
ANALYTICS_SCHEMAS_BRANCH=my-branch yarn workspace @tonkeeper/core generate:analytics
```

Anything generated that way depends on an unmerged schema, so regenerate from `main` once the PR
lands.

## Branch and commit conventions

From `CONTRIBUTING.md`:

**Branch names:** `feature/<description>`, `fix/<description>`, `hotfix/<description>`

**Commit format:** `<type>(<scope>): <description>` using Conventional Commits.

-   Types: `feat`, `fix`, `chore`, `refactor`, `docs`
-   Scopes: `desktop`, `extension`, `web`, `core`, `uikit`, `locales`, `mobile`, `twa`

## Key dependency notes

-   `@tanstack/react-query` is pinned to `4.3.4` **without** a range specifier across all apps —
    this is intentional in the lockfile but means it never auto-updates.
-   `react-router-dom` is v5 across all apps.
-   `typescript` is v4 in most packages; `apps/mobile` uses v5.
-   `prettier` is v2.
-   `@tma.js/sdk` uses `"latest"` — treat it as potentially unstable at install time.
-   `electron` is on v32; upgrade carefully as it requires matching `@electron-forge/*` versions.
