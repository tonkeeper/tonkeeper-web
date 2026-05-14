# Tonkeeper Web — Test Plan (working draft)

Temporary document. Translates the regression checklist into English, then assigns each item to unit / integration / e2e / manual, with the reasoning so the split can be challenged before implementation.

## Conventions

- **Unit** — `vitest`, pure TS, no DOM. Lives in `packages/core` (already configured) and `packages/uikit` (to be added).
- **Integration** — `vitest` + `jsdom` + `@testing-library/react`. Components/hooks/state with mocked `appSdk`, `Storage`, network, and time. Lives in `packages/uikit`.
- **Component visual** — `@playwright/experimental-ct-react`. A complex UI subtree mounted in real Chromium with prop fixtures and the styled-components theme; rendered output snapshotted (`toHaveScreenshot`). Catches layout/spacing/theme regressions that jsdom can't see. Lives in `packages/uikit/component-tests/`; screenshots committed under `tests/playwright/__screenshots__/`.
- **E2E** — Playwright against a built web app served locally (`vite preview`). Network calls to tonapi/tonconsole/pro are mocked at the `page.route` layer. No real seeds, no real funds; throwaway fixture seed.
- **Manual** — anything that requires real funds, real third-party UI, real hardware, real OS/native APIs, or a human "does this still feel right" judgement that snapshots can't capture.

Tier rule of thumb:
1. If a behavior is a pure function or message-builder → unit.
2. If it is a form/screen reacting to fake data → integration.
3. If the *risk* is layout/spacing/theme (not behaviour) on a complex component → component visual.
4. If it spans router + state + multiple screens → e2e.
5. If it spends money, talks to a third-party UI we don't control, or requires hardware → manual.

---

## 1. Wallet creation and import

| # | Item (EN) | Tier | Notes |
|---|---|---|---|
| 1 | Create new wallet | E2E | Smoke: welcome → create → password → name → dashboard. |
| 2 | Add wallet versions via the gear icon | Integration | Render the versions modal against a fixed seed; assert all expected versions listed with correct addresses. Address calc itself is unit. |
| 3 | "Open" on a wallet card drops into that wallet | E2E | Pure routing, asserted via URL + visible name on dashboard. |
| 4 | Connect existing Tonkeeper wallet (24w) | E2E | Testnet seed in CI secrets. |
| 5 | Create multi-account | E2E | Add second wallet from the switcher; both visible. |
| 6 | Import multi-account | E2E | Multiple addresses derived from one seed appear in switcher. |
| 7 | Import wallet by private key (dev menu) | Integration | Dev menu lives behind a flag; unit-test the key→wallet derivation, integration-test the form. |
| 8 | Import 12-word seed (BitGet/Trust/OKX) — addresses match expected | **Unit** | Table-driven test: for each known provider seed, derive and assert canonical address. No UI needed. |
| 9 | Import 24-word seed (e.g. BitGet) — addresses match expected | **Unit** | Same. |
| 10 | Import Testnet-only / Mainnet-only | Integration | Network toggle on add-wallet screen; assert resulting account's network. |
| 11 | Watch Account by [address] / [DNS] / [Telegram username] | Unit + Integration | Resolver per input kind is unit. Form (paste → resolve → preview address) is integration with mocked resolver. |
| 12 | Create Multisig wallet | Integration | Render multisig creation form, fill signers/threshold, snapshot the deploy message. Actual deploy → manual. |
| 13 | Send a transaction from multisig and sign it — success | **Unit (build) + Manual (broadcast)** | Build payload + snapshot BoC = unit. Co-signer flow on a real network = manual. |

## 2. Seed phrase screen

| # | Item | Tier | Notes |
|---|---|---|---|
| 14 | Seed phrase screen (on create, and in settings) renders correctly, no scrolling | E2E (presence) + **Component visual** (layout) | E2E asserts all 24 number labels are present and not clipped. Pixel layout (grid spacing, modal sizing across viewports) is a `playwright-ct` snapshot. |

## 3. Main screen

| # | Item | Tier | Notes |
|---|---|---|---|
| 15 | Correct fiat balance (TON + jettons) on dashboard | Unit + Integration | Sum-of-jettons-in-fiat is unit. Rendering with mocked rates is integration. |
| 16 | Wallet address visible | E2E | Smoke. |
| 17 | Balance is the sum of all fiat lines on the home page | Unit | Same calculation, table-driven. |

## 4. Buy TON

| # | Item | Tier | Notes |
|---|---|---|---|
| 18 | Buy TON from main screen → TON preselected | Integration | Open the buy sheet, assert default token. The actual third-party purchase widget → manual. |

## 5. Send

| # | Item | Tier | Notes |
|---|---|---|---|
| 19 | Send TON from main screen: address/comment/recent picker; TON preselected; tx success; check layout | E2E (up to confirm) + Manual (real send) | E2E walks the form to the confirm sheet and snapshots the outgoing message. "Tx success" + "check layout" stay manual. |
| 20 | Confirm sheet shows amount, recipient, fee → confirm → return to main | E2E | Up to confirm tap; do not broadcast. Mock the broadcast response to test routing back. |
| 21 | "Details" button on tx details opens Tonviewer.com | Integration | Assert anchor `href`; do not navigate. |
| 22 | Send TON from token screen opens the `<token>` flow | E2E | Routing only. |
| 23 | Send a non-TON jetton (e.g. USDT) | E2E (form) + Manual (send) | Jetton transfer message-builder = unit. Form flow = e2e to confirm. |
| 24 | "Continue" disabled while Amount ≤ 0; back arrow works | Integration | Pure form validation. |
| 25 | Amount accepts integers and decimals, up to 9 decimals | **Unit** | Input mask / parser. |
| 26 | "Max" button fills entire balance; layout ok | Integration | Click Max, assert input value and that fee preview doesn't overflow. |
| 27 | Amount switchable between TON and fiat | Unit + Integration | Conversion math = unit. Toggle behaviour = integration. |
| 28 | Recipient field accepts address / DNS / TG username / QR | Unit (resolvers) + Integration (form) + Manual (real camera) | QR scanner with a real camera = manual; the scanner result handler is integration. |
| 29 | Favorites + recents list; favorites on top; check layout | Integration | Seed state, render, assert ordering. |
| 30 | Recents contains only addresses the user has sent to | **Unit** | Filter function over tx history. |
| 31 | Visible token list is configured in Settings → Manage tokens | Integration | Toggle in settings, navigate to send, assert filtered list. |

## 6. Receive

| # | Item | Tier | Notes |
|---|---|---|---|
| 32 | "Receive" on TON / Tokens screen opens Receive Toncoin; QR scans + copy address | Integration + Manual (camera scan) | QR string correctness = unit. QR DOM render = integration. Scanning with a phone = manual. |
| 33 | "Receive" on a jetton screen → jetton receive → QR + copy | Integration | Same. |
| 34 | "Receive" on main screen → QR + copy | Integration | Same. |

## 7. Swap

| # | Item | Tier | Notes |
|---|---|---|---|
| 35 | Swap: choose send/receive tokens + provider → continue → confirm → success; check layout | Integration (form + provider selection) + Manual (real swap) | Provider quote payload mocked. Building the swap message is unit. |

## 8. QR

| # | Item | Tier | Notes |
|---|---|---|---|
| 36 | QR scan works on the address-entry screen (send flow) | Integration + Manual | Scanner result handler integration-tested with a fake payload; real camera manual. |
| 37 | QR for receiving TON is correct | **Unit** | Encode a `ton://` URI for a known address and amount; snapshot. |
| 38 | QR for receiving a jetton is correct | **Unit** | Same, jetton transfer URI. |

## 9. History

| # | Item | Tier | Notes |
|---|---|---|---|
| 39 | History tab: txs newest → oldest | Integration | Mock tonapi `/accounts/.../events`, assert order. |
| 40 | History loads older txs, details open, fiat conversion shown | Integration | Trigger pagination, open a tx, assert fiat line uses mocked rate. |
| 41 | Pending tx appears with clock, then transitions to completed | Integration | Drive the realtime hook with two fake events. |

## 10. NFT / Discover

| # | Item | Tier | Notes |
|---|---|---|---|
| 42 | Discover tab carousel auto-scrolls; any service is openable | Integration + Manual (timing feel) | Auto-scroll timing → manual; service click navigates → integration. |
| 43 | Collections tab (Pro: Purchases) toggles Tokens/NFT; NFT list with images | Integration | Mock NFT list, assert switch + image `src`s. |
| 44 | NFT detail: name, image, description; approved collections show a check icon | Integration | Render against fixtures with/without approval flag. |
| 45 | NFT buttons: View on NFT marketplace, Link a name, Send + details | Integration | Anchor + button presence; routing. |
| 46 | Send NFT mirrors Send TON flow | E2E (form to confirm) + **Unit** (message builder) | NFT transfer payload snapshot is unit. |

## 11. TonConnect

| # | Item | Tier | Notes |
|---|---|---|---|
| 47 | TonConnect with dapp — connect to getgems.io (uses proof) | Manual + **Unit (proof builder)** | Proof signing input/output is unit-tested with fixed seed. Live dapp connection is manual. |
| 48 | TonConnect — connect to ston.fi / dedust.io (no proof) | Manual + Integration | Integration test renders the connect modal given a tc:// payload; live connection manual. |
| 49 | Wallet successfully connects ("Connect wallet") | E2E | Mocked bridge: paste tc:// → modal → approve → connected state. |
| 50 | Dapp tx success: swap 0.5 TON → USDT on ston.fi / dedust | Manual | Real on-chain swap. |
| 51 | app.ston.fi → click wallet address → opens Tonkeeper | Manual | Browser handler / deeplink registration, OS-dependent. |
| 52 | Transaction shows up in Tonkeeper (e.g. DNS purchase) | Integration | Bridge message → request appears in tx-request notification. |
| 53 | Reconnect works | Integration | Seed an existing session, reload, assert restored. |

## 12. Hardware wallets

| # | Item | Tier | Notes |
|---|---|---|---|
| 54 | Keystone confirmation | **Unit (UR encode/decode) + Manual (device)** | QR payloads tested with fixtures. Device interaction manual. |
| 55 | Signer confirmation (TON / jetton / NFT / multi-tx) | **Unit (payload) + Manual** | Same pattern. |
| 56 | Ledger confirmation (TON + jetton; swap on StonFi) | **Unit (APDU/build) + Manual** | USB/BLE → manual. |

## 13. Exchanges (CEX)

| # | Item | Tier | Notes |
|---|---|---|---|
| 57 | Send to exchange address succeeds | Manual | Real CEX deposit. |
| 58 | Mandatory comment for known exchange addresses | Integration + **Unit** | Address-classifier (is-exchange) is unit. Form enforcement is integration. |

## 14. Pro features regression

| # | Item | Tier | Notes |
|---|---|---|---|
| 59 | Pro dashboard | Integration + Manual | Render dashboard for a Pro account fixture. Auth/subscription token verification = manual. |
| 60 | Buy Pro subscription | Manual | Real payment. |
| 61 | Multisend TON | E2E (form to confirm) + **Unit** (CSV parser, batch builder) | |
| 62 | Multisend USDT | Same. | |
| 63 | Multisend USDT gasless | Same + **Unit** (gasless payload). | |

## 15. Battery

| # | Item | Tier | Notes |
|---|---|---|---|
| 64 | Battery (top-up, balance, refund flows) | Integration + Manual | Top-up purchase → manual. Balance display + fee estimate → integration with mocked battery API. Unit-test the fee calc. |

## 16. Settings + sign-out

| # | Item | Tier | Notes |
|---|---|---|---|
| 65 | Settings | E2E (smoke nav) + Integration (per-row) | Smoke: every row opens its screen without crash. Each setting's logic → integration. |
| 66 | Sign out of one wallet | E2E | State cleared; switcher shows remaining wallets. |
| 67 | Sign out of all wallets | E2E | Back to welcome screen; storage cleared. |

---

## Coverage summary

### Unit (`packages/core` + new `packages/uikit` setup)

Pure logic, fastest to write and run. Largest payoff.

- Mnemonic → address derivation for v3R1 / v3R2 / v4R2 / W5 / W5-beta on 12- and 24-word seeds (#8, #9, #2).
- Address / DNS / TG-username resolvers (#11, #28).
- Amount input parser and TON↔fiat math (#25, #27).
- Fiat-sum formatter (#15, #17).
- Recents filter, favorites ordering (#29, #30).
- Exchange-address classifier (#58).
- Message builders, BoC snapshots: TON transfer, jetton transfer, NFT transfer, swap (StonFi/DeDust), multisig propose+approve, multisend batch (gasful + gasless), DNS purchase, Pro subscription (#19, #23, #35, #46, #61–63, #13).
- TonConnect proof builder (#47).
- Hardware payload builders: Keystone UR, Signer payload, Ledger APDU (#54–56).
- QR URI encoders for receive TON and jettons (#37, #38).
- Battery fee math (#64).

### Integration (`packages/uikit` with jsdom)

Component / hook / state in isolation with mocked SDK + network.

- Form validation: Continue disabled until amount > 0, decimal cap, Max button, TON/fiat toggle (#24, #26, #27).
- Recipient picker: favorites first, recents filtered, paste address/DNS/TG (#28–31).
- Send-flow form up to confirm sheet (no broadcast) — content of confirm sheet (amount, recipient, fee), Tonviewer link `href` (#19, #20, #21).
- Receive sheets (TON, jettons, main) — QR present, copy works (#32–34).
- Swap form with mocked provider quote (#35).
- History tab: ordering, pagination, pending→completed transition, fiat conversion in details (#39–41).
- NFT detail rendering (approved icon, buttons present), Discover carousel click (#42–45).
- TonConnect modal rendering from tc:// payload, request notification (#48, #49, #52), session restore (#53).
- Multisig creation form (#12).
- Pro dashboard rendering with fixtures (#59).
- Battery balance display with mocked API (#64).
- Settings rows per-screen (#65).
- Manage Tokens reflects in Send token list (#31).
- Exchange comment enforcement (#58).
- Versions modal addresses (#2).
- Network-toggle on add-wallet (#10).
- Watch-only form (#11).
- Buy sheet default token (#18).

### E2E (Playwright on built `apps/web`)

Cross-screen flows worth checking with a real browser, all against mocked network.

- Welcome / Get started → main flows render (smoke).
- Create new wallet to dashboard (#1).
- Import 12w / 24w to dashboard (testnet seed) (#4).
- Watch-only by address to read-only dashboard (#11).
- Multi-account: add second, switcher shows both, "Open" switches (#3, #5).
- Lock + unlock with password.
- Backup screen renders 24 numbered labels (#14, count-only — no value comparison).
- Send TON flow to confirm sheet, then mocked broadcast → routed back to main (#19, #20).
- Send jetton flow to confirm (#22, #23).
- Send NFT flow to confirm (#46).
- TonConnect: paste tc:// → connect modal → approve → connected (#49).
- Multisend flow to confirm (#61–63, mocked).
- Sidebar nav: every route navigates with no console error (#65).
- Sign out single (#66) and sign out all (#67).
- Manage Tokens → return to send → list updated (#31).

### Component visual (`@playwright/experimental-ct-react`)

Complex UI mounted in a real browser, props-only, layout snapshotted. The point isn't "does it work" (integration handles that) — it's "does it still look right" without paying for an e2e flow.

Candidates (cross-referenced with checklist items where layout/visual is a stated risk):

- Seed phrase backup grid — 24 cells, no clipping, dark + light theme (#14).
- Send confirm sheet — amount, recipient, fee, warning rows; long-address truncation; long-comment wrapping (#19, #20, #26).
- Receive sheet — QR + address block + copy button (#32–34).
- NFT detail card — image, name, approved-collection badge, button row (#44, #45).
- Pro dashboard widgets — totals + charts in fixture states (empty / partial / full) (#59).
- Swap form — provider selector, rate row, slippage, route preview (#35).
- Multisig creation form — signer list, threshold control (#12).
- Multisend table row — address + amount + comment columns at min/max widths (#61–63).
- History row variants — incoming/outgoing/pending/failed × TON/jetton/NFT/swap matrix (#39–41).
- Battery widget — 0 / low / full balance variants (#64).

What it catches: regressions in spacing, wrapping, overflow, dark/light theme drift, large-font-size drift. What it doesn't catch: behaviour (stays integration), router flows (stays e2e), font rendering across OSes (Chromium-only in CI to avoid flake; fonts must be served, not OS-installed).

Skip stories that depend on time, random, or live data — those go to integration. Snapshots regenerated only on deliberate visual change via `--update-snapshots`, with the diff reviewed in PR.

### Manual (cannot or should not automate)

- Anything that spends real funds: on-chain TON / jetton / NFT / swap / multisig broadcast / multisend broadcast / DNS purchase / Buy TON / Buy Pro / Battery top-up / CEX deposits (#13, #19–23, #35, #46, #50, #57, #60, #64).
- Hardware-wallet device interaction: Ledger USB/BLE, Keystone QR camera, Signer device (#54–56).
- Real third-party dapp UIs: getgems, ston.fi, dedust connect/swap flows (#47, #48, #50, #51).
- OS-level deeplink registration (tonkeeper:// from a browser) (#51).
- Real camera QR scanning (#28, #32–34, #36).
- Telegram WebApp environment for the TWA app (#— TWA build, not in checklist directly but relevant).
- Initial "does this design look right" judgement on a *new* component. Once a baseline snapshot is approved, `playwright-ct` catches subsequent regressions; new components still need a human to bless the first snapshot.

---

## What the existing `tests/playwright` suite contributes

Specs themselves: discard (selectors are locale-bound text and `nth(N)`; target prod URL; do real sends on real seeds). Keep them as a flow checklist only — they encode some non-obvious paths (multisig add/delete, hide-and-add multiaccount, version labels) that we shouldn't lose track of when porting.

Infrastructure: keep the Playwright dependency, the `web-tests.yaml` skeleton, and the secret-injection pattern (re-target at a single testnet seed instead of 11 mainnet seeds).

---

## Decisions

1. **Seed strategy**: throwaway test-only mnemonic, committed as a fixture in the test repo. Testnet is known to be unstable and is not used for wallet testing, so the seed never hits a real chain — tonapi/tonconsole/pro/battery responses are mocked at the `page.route` layer. The seed only needs to derive valid addresses. No CI secret needed.
2. **`data-testid`**: yes, add anchors in `uikit`. **Gated by an automated stale-id check** — every `data-testid="X"` in `uikit`/`apps` source must be referenced by at least one test file, enforced in CI. Without this, testids rot into dead markup. The check is part of the testing infra, not optional.
3. **E2E mocking**: `page.route` fixtures per spec. A shared response library lives in `tests/playwright/fixtures/` and each spec installs only the routes it needs.
4. **Pro entitlement**: mocked at the network layer. The Pro state endpoint is one of the route fixtures; app code is untouched. No dev-mode bypass flag.
5. **Multisig e2e v1**: forms only — creation form to confirm sheet, propose-tx form to confirm sheet. Co-signer/broadcast loop stays manual. Re-evaluate after TonConnect mock-bridge work, in case the same fixture pattern makes a 2-context multisig spec cheap.
6. **Visual regression**: `@playwright/experimental-ct-react` for layout-risk components, separate from the e2e suite. Chromium-only in CI, snapshots committed, deliberate updates require `--update-snapshots` + PR review of the image diff. Same Playwright dependency as e2e, so no extra runtime to maintain.

---

## Suggested implementation order

1. **Test infra foundation**: vitest + jsdom + RTL in `packages/uikit`; coverage gate in `packages/core`; the `data-testid` stale-id CI check (greps source for testids, asserts each appears in a test file, fails CI otherwise). (~1 day)
2. **Unit batch 1**: amount parser, fiat sum, address/DNS/TG resolvers, recents filter, exchange classifier. (~1 day)
3. **Unit batch 2**: message-builder BoC snapshots for TON / jetton / NFT / swap / multisend / multisig. (~2 days)
4. **uikit testid anchors**: add ~20 `data-testid`s. The stale-id check from step 1 keeps them honest — any testid landed here must be claimed by a test in step 5 or it fails CI. (~0.5 day)
5. **E2E rebuild**: new `playwright.config.ts` with local `vite preview` web server, throwaway fixture seed in `tests/playwright/fixtures/seed.ts`, shared `page.route` response library, storage-state auth fixture. Land 3 smoke specs (welcome, import-24, sidebar nav) — these consume the testids from step 4. (~1.5 days)
6. **Integration batch 1**: send-form (amount, recipient picker, Max, fiat toggle), confirm sheet, receive sheets. (~2 days)
7. **E2E batch 2**: send to confirm, multi-account, watch-only, backup screen, sign-out, lock/unlock. (~1.5 days)
8. **Integration batch 2**: history, NFT, TonConnect modal + reconnect, settings rows, Manage Tokens flow, Pro dashboard (mocked entitlement). (~2 days)
9. **Component visual setup**: `@playwright/experimental-ct-react` project under `packages/uikit/component-tests/`, separate config (Vite bundler, Chromium-only), styled-components theme + i18n providers wired into `mount()`. First batch of stories: seed-phrase grid (#14), send confirm sheet (#19/#20), receive sheet (#32–34), history row matrix (#39–41), NFT detail card (#44). (~1.5 days)
10. **CI wiring**: `unit` + `integration` + `e2e-smoke` + `component-visual` + `testid-stale-check` jobs into `pull-request.yaml` as required checks; demote the existing `playwright.yaml` to manual-only against staging. (~0.5 day)
11. **Component visual batch 2**: Pro dashboard widgets, swap form, multisig creation form, multisend row, battery widget. Lands once batch 1's snapshot-review process is settled. (~1 day)
12. **Unit batch 3**: HW payloads (Keystone UR, Signer payload, Ledger APDU), TonConnect proof, multisig builder, gasless multisend. (~1 day)
