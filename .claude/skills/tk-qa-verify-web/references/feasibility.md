# Feasibility rubric (web)

Classify each case, then the ticket. Name the screen, the selector, the backend host and the wallet.

## Case classes

| Class           | Signs                                                                | How the agent verifies                                                                      | Cost                |
| --------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------- |
| `ui`            | new screen, row, toggle, text, navigation                            | Playwright assert on role/text/test id                                                      | S                   |
| `backend-state` | provider errors, limits, empty lists, statuses                       | `page.route()` mock in the spec, recorded from a real response first                        | M                   |
| `not-rendered`  | request body, which provider answered, analytics event               | `page.waitForRequest()` / `page.route()` capture, assert on the payload                     | M                   |
| `persisted`     | currency, hidden assets, dismissed banners, settings                 | `page.reload()` + UI assert, or `page.evaluate` on `localStorage` keys `tonkeeper_<AppKey>` | S                   |
| `money`         | send, swap, stake, perps deposit/withdraw                            | quote/confirm screens free; signing via `signPlanned()` with an approved plan               | M + funds           |
| `fresh-wallet`  | defaults, empty states, onboarding                                   | a new context without `storageState`; create a wallet in the test (never import a seed)     | M                   |
| `empty-battery` | gasless / battery fallback, "charge battery" prompts, relayer errors | wallet C (`walletC`); never charge it; fund only the token the case needs                   | M                   |
| `human-visual`  | colour, spacing, animation, icon, "matches Figma"                    | screenshot attached, no assert, human judges                                                | S, no agent verdict |
| `platform`      | extension popup, desktop (Electron), iPad (Capacitor), TWA           | not covered in v1 → manual; say which platform                                              | —                   |
| `hardware`      | Ledger, Keystone, Signer                                             | manual                                                                                      | —                   |
| `time`          | cooldowns, "once a day"                                              | persisted counter via storage, else manual                                                  | L or manual         |

## Ticket verdict

-   **Automatable** — every case is `ui`, `persisted`, `not-rendered` or `money` within caps.
-   **Automatable with mocks** — at least one `backend-state` case.
-   **Partial** — the core is automatable; named cases need a platform, hardware or funds over the
    cap.
-   **Manual only** — nothing observable from the web client.

## Estimate

| Size           | Meaning                                                                                |
| -------------- | -------------------------------------------------------------------------------------- |
| S ≤ 1 h        | existing selectors, one spec                                                           |
| M 1–3 h        | new selectors, one mock, or one money round trip                                       |
| L ≥ half a day | missing test ids on key controls (follow-up first), several mocks, money on two chains |

## Adjacent areas from the PR

| Changed path                                                   | Smoke also                                                               |
| -------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `packages/core/src/service/**`, `packages/core/src/entries/**` | every screen that renders that service's data, on wallets A and B        |
| `packages/core/src/*ApiGenerated/**`                           | one flow that sends the request, one that renders the response           |
| `packages/core/src/multichain.ts`, `entries/account.ts`        | wallet A and wallet B home + account switcher                            |
| `packages/core/src/Keys.ts`, storage code                      | reload persistence of the touched setting                                |
| `packages/uikit/src/state/**` (react-query)                    | each screen that reads the query; check the invalidation after an action |
| `packages/uikit/src/primitives/**`                             | two unrelated screens that use the primitive, light + dark               |
| `packages/uikit/src/components/layout/AppLayout.tsx`           | desktop viewport and 390×844 mobile viewport                             |
| `packages/locales/**`                                          | the changed copy in English and one other language                       |
| `apps/extension/**`, `apps/desktop/**`, `apps/mobile/**`       | `platform` → not covered in v1                                           |
| send / swap / perps code                                       | the confirm screen on both wallets; money only per plan                  |
