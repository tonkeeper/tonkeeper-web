# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository overview

Yarn 4 monorepo with Turborepo for a non-custodial TON blockchain wallet. Two shared packages feed six platform apps:

- **`packages/core`** — business logic, API clients, crypto services, account model (no React)
- **`packages/uikit`** — all React components, state hooks, pages (depends on core)
- **`packages/locales`** — i18n translation files
- **`apps/web`** — Vite SPA
- **`apps/extension`** — Chrome/Firefox browser extension (MV2 for Firefox, MV3 for Chrome)
- **`apps/desktop`** — Electron app via `electron-forge`
- **`apps/twa`** — Telegram Mini App (Vite)
- **`apps/mobile`** — Capacitor iPad app (Vite)
- **`apps/web-swap-widget`** — embeddable swap widget (Vite)

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

# Playwright E2E tests (run from tests/playwright)
yarn workspace @tonkeeper/playwrite test

# Lint
yarn eslint --ext .ts,.tsx .
```

**Build outputs:**
- `apps/web/dist` — web app
- `apps/extension/dist/chrome` and `dist/firefox` — extensions
- `apps/desktop/out` — desktop application
- `packages/*/dist` — compiled package artifacts

## Architecture: platform abstraction via `AppSdk`

Every platform app creates its own class that extends `BaseApp` and implements `IAppSdk` (defined in `packages/core/src/AppSdk.ts`). This is the central abstraction: it holds the `IStorage` instance, emits `UIEvents` (unlock, transfer, scan, toast, etc.), and provides platform-specific methods (clipboard, open URL, biometry, keychain, cookie cleanup, etc.).

`uikit` hooks access the SDK via `useAppSdk()` — never import platform-specific implementations from apps into `uikit`.

**Desktop:** `DesktopAppSdk` proxies all storage and system calls over Electron IPC to the main process (`apps/desktop/src/electron/background.ts`), using a `sendBackground()` bridge. Mnemonic/keys are stored in the OS keychain via `keytar`.

**Extension:** The extension has three contexts — popup (React UI), background service worker, and content script. The background handles DApp connections and message routing between contexts using `webextension-polyfill`.

## Architecture: storage

`IStorage` (defined in `packages/core/src/Storage.ts`) is a simple async key/value interface:
```ts
get<R>(key: string): Promise<R | null>
set<R>(key: string, value: R): Promise<R | null>
delete<R>(key: string): Promise<R | null>
clear(): Promise<void>
```

All storage keys are centralized in `packages/core/src/Keys.ts` under the `AppKey` enum. Never use raw string keys.

## Architecture: state management

- **Server/async state** — `@tanstack/react-query` (pinned to `4.3.4`). All cache keys are defined in `packages/uikit/src/libs/queryKey.ts` as the `QueryKey` enum. Use `anyOfKeysParts(...keys)` for broad invalidations.
- **Reactive SDK state** — custom `Atom`, `Subject`, and `ReplaySubject` classes in `packages/core/src/entries/atom.ts`. The `AppSdk` holds atoms for active wallet, active account, lock state, etc.
- **UI context** — `AppContext` (from `packages/uikit/src/hooks/appContext.ts`) provides API config, feature flags (`standalone`, `extension`, `ios`, `proFeatures`, `hideLedger`, etc.), and the analytics tracker. Populated by each app's root component.

## Architecture: account model

Defined in `packages/core/src/entries/account.ts`. The union type `Account` covers:

| Class | Description |
|---|---|
| `AccountTonMnemonic` | Standard mnemonic wallet (mainnet) |
| `AccountTonTestnet` | Testnet mnemonic wallet |
| `AccountTonSK` | Secret-key based wallet |
| `AccountMAM` | Multi-account mnemonic (HD derivation) |
| `AccountLedger` | Ledger hardware wallet |
| `AccountKeystone` | Keystone hardware wallet |
| `AccountTonWatchOnly` | Watch-only, no signing |
| `AccountTonOnly` | Address-only, no mnemonic |
| `AccountTonMultisig` | Multisig contract account |

Each account has one or more `TonWalletStandard` entries (wallet versions V3R1–V5R1). The `activeAccountId` and per-account `activeTonWalletId` are stored under `AppKey.ACTIVE_ACCOUNT_ID` and `AppKey.ACCOUNT_CONFIG`.

## Architecture: packages build pipeline

`packages/core` and `packages/uikit` compile via `tsc` only — no bundler. Imports between packages use the compiled `dist/` output (e.g., `@tonkeeper/core/dist/entries/account`). When changing core or uikit, run `yarn workspace @tonkeeper/core build` (or `build:pkg` via Turbo) before the consuming app picks up the changes.

Turbo's task graph: `build:pkg` runs first, then all `build:*` app tasks depend on it.

## Regenerating API clients

`packages/core` ships auto-generated clients for several Tonkeeper backends. Regeneration requires a `GITHUB_TOKEN` with `Contents: Read` on the relevant private repo:

```sh
export GITHUB_TOKEN=<your-token>
yarn workspace @tonkeeper/core generate:tonkeeperApi   # tonendpoint_backend
yarn workspace @tonkeeper/core generate:2faApi          # tonkeeper_2fa_backend
yarn workspace @tonkeeper/core generate:batteryApi      # custodial-battery
yarn workspace @tonkeeper/core generate:pro             # pro_backend
yarn workspace @tonkeeper/core generate:tonConsoleApi   # tonconsole_backend
yarn workspace @tonkeeper/core generate:sdkV2           # public, no token needed
```

## Branch and commit conventions

From `CONTRIBUTING.md`:

**Branch names:** `feature/<description>`, `fix/<description>`, `hotfix/<description>`

**Commit format:** `<type>(<scope>): <description>` using Conventional Commits.
- Types: `feat`, `fix`, `chore`, `refactor`, `docs`
- Scopes: `desktop`, `extension`, `web`, `core`, `uikit`, `locales`, `mobile`, `twa`

## Key dependency notes

- `@tanstack/react-query` is pinned to `4.3.4` **without** a range specifier across all apps — this is intentional in the lockfile but means it never auto-updates.
- `react-router-dom` is v5 across all apps.
- `typescript` is v4 in most packages; `apps/mobile` uses v5.
- `prettier` is v2.
- `@tma.js/sdk` uses `"latest"` — treat it as potentially unstable at install time.
- `electron` is on v32; upgrade carefully as it requires matching `@electron-forge/*` versions.
