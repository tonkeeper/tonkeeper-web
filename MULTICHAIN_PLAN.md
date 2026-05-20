# Multichain support — roadmap & architecture notes

Status: **draft for team review** Owner: TBD Target apps for first release: `apps/web`,
`apps/desktop`, `apps/extension`, `apps/mobile` Out of scope for first release: `apps/twa`

---

## TL;DR

-   **5 phases**, gated by a Phase 0 spike that resolves three risks (chain-kit packaging, Solana
    availability, mobile/extension WASM constraints).
-   **Refactor before adding.** Phases 1–2 are "TON-only refactor that fits the multichain shape" —
    no user-visible chains yet. This is the only way to avoid `getSigner()` becoming a 500-line
    switch.
-   **New account variant `AccountMultichain`** is added in Phase 2 alongside existing types.
    Existing TON-only accounts stay byte-identical. Migration is opt-in via Phase 4.
-   **One launch flag** `multichainEnabled`, plumbed through `IAppContext`. Each chain dark-launched
    behind it across all 4 target apps.

---

## Context: what the existing codebase looks like

Three findings reshape the plan before the phases:

1. **chain-kit is consumable but not turnkey.** It's a private KMP repo with a working JS target
   (Kotlin/JS + Trust Wallet Core WASM), but no published npm artifact, and **Solana is not
   implemented** (placeholder module). API shape is `ChainMediator` per chain, not per-chain
   `*Adapter` classes — the scope doc's adapter naming doesn't match the SDK.
2. **TON-leakage is deeper than the account model.** `getSigner()` in
   `packages/uikit/src/state/mnemonic.ts:267-433` is a 157-line switch on `account.type`.
   `CellSigner` assumes TON Cell signing. `walletContract()` hardcodes `workchain = 0`. Hundreds of
   components call `useActiveWallet()` and assume `TonWalletStandard`. A new `AccountMultichain`
   variant **cannot ship cleanly without prior refactor** of the signer / wallet-contract /
   derivation chokepoints.
3. **TRON is already bolted on** (derived from TON entropy via `tronWalletByTonMnemonic`). That's
   the template for how _not_ to add chains — a parallel branch in every flow. The multichain plan
   **replaces** TRON's plumbing, not extends it.

---

## Architectural decisions

| Decision                             | Recommendation                                                                                                                                                                                                 | Why                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Account model                        | New `AccountMultichain` variant in the `Account` union                                                                                                                                                         | Existing TON-only types untouched; migration is opt-in.                                                                                                                                                                                                                                                                                    |
| Legacy mnemonic types & import paths | TON-standard mnemonic and MAM (`TonKeychainRoot`) import/create paths remain permanently available, **not gated by `multichainEnabled`**. Only the new BIP39 multichain create/import flow is behind the flag. | TON-standard and MAM mnemonics use different KDFs than BIP39 — they derive different addresses and cannot be re-routed through the multichain flow. Users with paper backups of legacy seeds must always be able to import them on a fresh install. See [Open question #7](#open-question-7--create-flow-default-after-multichain-launch). |
| chain-kit consumption                | Vendor a built `.tgz` into the monorepo (or stand up a private npm registry) + write a thin TS facade in `packages/core/src/chains/`                                                                           | No public npm yet; we don't want every uikit file talking to Kotlin/JS `Companion.X` and `Res<T,E>`. Facade also future-proofs against breaking changes pre-1.0.                                                                                                                                                                           |
| Solana                               | Descope from initial release, ship in Phase 5                                                                                                                                                                  | chain-kit has it as a placeholder. See [Open question #1](#open-question-1--solana-timing).                                                                                                                                                                                                                                                |
| Signer abstraction                   | Replace `CellSigner` chokepoint with `ChainSigner<TMessage>` factory keyed on `(chain, accountType)`                                                                                                           | The current 157-line switch can't absorb 5 more chains. Factory pattern isolates each chain × account-type cell.                                                                                                                                                                                                                           |
| Active wallet                        | Add `account.activeWalletByChain: Record<Chain, WalletId>` to multichain accounts; new hook `useActiveWalletForChain(chain)`                                                                                   | `useActiveWallet()` currently returns _the_ TON wallet. Legacy variants keep working with the old hook.                                                                                                                                                                                                                                    |
| Per-chain secure storage             | Extend `IKeychainService` with chain-prefixed keys, not separate services per chain                                                                                                                            | Keeps platform implementations (`KeychainDesktop`, `KeychainCapacitor`, etc.) to one code path.                                                                                                                                                                                                                                            |
| Send flow                            | Rebuild as a parallel `SendMultichain` flow, not extend                                                                                                                                                        | Address validation, fee models (EVM gas / BTC fee-rate / Solana priority fee / TRON energy), and unit math diverge too much. Wrapping inflates complexity faster than parallel implementation.                                                                                                                                             |
| Receive / Buy / Portfolio / History  | Extend existing flows                                                                                                                                                                                          | Receive already has `chain?: BLOCKCHAIN_NAME`. Portfolio already aggregates jettons. History `ActivityItem` gains a `blockchain` field. Cheaper than parallel screens.                                                                                                                                                                     |
| Swap                                 | New cross-chain bridge flow alongside existing DEX swap                                                                                                                                                        | Existing flow is STON.fi/DeDust intra-TON. Cross-chain is a different product. Don't conflate.                                                                                                                                                                                                                                             |
| Migration                            | New service modeled on `StorageMigrationService` (`apps/mobile/src/libs/storage.ts:86-204`), with resumable progress tracked under a new `MULTICHAIN_MIGRATION_STATE` key                                      | Pattern already exists; reuse it.                                                                                                                                                                                                                                                                                                          |

---

## Phase 0 — Spike & risk-burn

These three unknowns can break the plan. Resolve before Phase 1.

| Risk                                | Spike work                                                                                                                                                                                          | Exit criterion                                                                                                                                                                                |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **chain-kit packaging**             | Build chain-kit `.tgz` locally; consume from a throwaway `packages/chain-sdk/` workspace; smoke test (mnemonic → EVM + BTC + TRON addresses + signed dummy tx). Decide: vendor vs private registry. | `yarn` install produces a working `import { CryptoKitClient } from '@tonkeeper/chain-kit'` and signs an EVM tx in a unit test.                                                                |
| **WASM on extension MV3**           | Bundle wallet-core WASM in `apps/extension` (Chrome MV3 + Firefox MV2); load via `chrome.runtime.getURL`. Measure bundle size delta.                                                                | Extension popup + background can `await ready()` and derive an address. Bundle delta documented. If MV3 blocks WASM, decide: extension descope vs. WASM-free signing path for extension only. |
| **WASM on Capacitor WebView (iOS)** | Same drill on `apps/mobile`. WKWebView's WASM streaming compile is restricted.                                                                                                                      | WASM loads via `WebAssembly.instantiate(buffer)`; derivation + signing work on iPad.                                                                                                          |
| **Solana availability**             | Confirm chain-kit Solana timeline with the chain-kit team.                                                                                                                                          | Decision: ship SOL in Phase 4 (if ready), or defer to Phase 5 / post-launch.                                                                                                                  |

**Deliverable:** A signed Phase 0 report listing exact bundle-size impact per app, chain-kit version
pinned for the project, Solana decision, and a 1-page "is this still on" gate.

---

## Phase 1 — TON refactor for multichain shape

**Goal:** No user-visible change. Strip TON assumptions from chokepoints so Phase 2 can plug in.

1. **`packages/core/src/chains/` facade.** New module wrapping chain-kit's `CryptoKitClient` and
   `ChainMediator`. Exposes `ChainAdapter` interface (our shape, not Kotlin's):
   `deriveAddress / validateAddress / signTransaction / formatAmount / estimateFee / broadcast`.
   Handles `await ready()` and `Res<T,E>` unwrapping.
2. **Signer factory.** Extract `getSigner()` (`packages/uikit/src/state/mnemonic.ts:267-433`) into a
   factory in `packages/core/src/service/sign/`, keyed on `(account.type, chain)`. Existing TON
   cases become `(*, 'ton')` entries. No behavior change. **Critical** — without this, Phase 2 is
   unmaintainable.
3. **Wallet contract factory.** Replace the hardcoded switch in
   `packages/core/src/service/wallet/contractService.ts:24-58` with a strategy per chain. TON keeps
   its `WalletContractVxxx` path; other chains stubbed.
4. **Derivation paths config.** Move `m/44'/607'/0'` out of
   `packages/core/src/service/mnemonicService.ts:15`. Each chain owns its BIP44 path in
   `packages/core/src/chains/<chain>/path.ts`.
5. **Active-wallet per-chain hook.** Add `useActiveWalletForChain(chain)` returning the chain's
   active wallet. For legacy accounts, defaults to TON. New hook unused yet — sets up Phase 2.
6. **`IAppContext.multichainEnabled` flag.** Wired through but always `false` outside dev builds.

**Snapshot tests for byte-identity.** Add a harness that signs N canonical TON transfers
pre-refactor and verifies the post-refactor signer produces identical BOCs. Gating CI.

**Exit:** All existing apps build and tests pass with new abstractions; TON behavior byte-identical
to pre-refactor. **TRON code paths stay as-is** in this phase — replaced in Phase 3.

---

## Phase 2 — `AccountMultichain` + key management

1. **New variant `AccountMultichain`** added to the `Account` union in
   `packages/core/src/entries/account.ts`. Fields: standard BIP39 seed (encrypted),
   `enabledChains: Chain[]`, `activeWalletByChain: Record<Chain, WalletId>`, per-chain wallets
   (`EvmWallet | BtcWallet | TronWallet | SolWallet | TonWalletStandard`).
2. **Per-chain wallet entries** in `packages/core/src/entries/wallet.ts`. Keep `TonWalletStandard`
   untouched; add `EvmWallet`, `BtcWallet`, etc.
3. **Unified seed flow.** Standard 12/24-word BIP39 phrase (no TON-specific mnemonic standard).
   Per-chain address derivation via chain-kit's
   `CryptoWallet.fromMnemonic(...).getAddress(Chain.X)`.
4. **Account creation flow.** "Create multichain wallet" entry point behind `multichainEnabled`.
   Generates seed → derives all enabled chains' addresses → user confirms backup → account saved.
5. **Import flow.** Accepts BIP39, optional override of standard derivation paths per chain.
6. **Storage keys.** New `AppKey` entries: `MULTICHAIN_ACCOUNTS`, `MULTICHAIN_CHAIN_CONFIG`. Reuse
   encrypted secret pattern from existing `meta_encryption_map`.
7. **Per-chain secure storage.** Extend `IKeychainService` with `getValue(chain, key)` etc.;
   platform impls prefix keys.

**Exit:** Dev builds can create a multichain account and display all 4 chain addresses
(TON/EVM/BTC/TRON). No transactions yet. No migration. Existing TON accounts unaffected.

---

## Phase 3 — Read paths

Make a multichain account _useful read-only_ before adding sending.

1. **Portfolio aggregation.** Extend `useAssets()` to loop enabled chains. Each chain's balance
   query keyed under `QueryKey.chainBalances` (new) with chain in key parts. Spam filtering per
   chain (chain-kit verification or our own blacklist hooks).
2. **Receive flow.** Extend existing `ReceiveContent` in
   `packages/uikit/src/components/home/ReceiveNotification.tsx:33` which already accepts
   `chain?: BLOCKCHAIN_NAME`. Add EVM/BTC/SOL handlers in the tabs. Per-chain QR payload format.
   **Replace** the TRON tab — TRON now flows through the same chain-kit path.
3. **Buy flow.** Extend provider config to include `supportedChains: Chain[]` per provider. UI shows
   providers filtered by selected chain+token. URL params updated per provider's chain selector.
4. **Per-asset history (Phase 1 of history scope).** New per-asset history screens for
   EVM/BTC/SOL/TRON using chain-kit's `transaction.findTransaction` and the platform indexer (TBD
   per chain — likely Etherscan-style for EVM, BlockCypher for BTC, etc.). Note: this adds new
   backend dependencies — surface to BE team early.
5. **Manage tokens / hide spam.** Existing `Manage tokens` UI extended to be per-chain.

**Exit:** A user with a multichain account can see balances, receive funds, buy crypto, and see
history across TON/EVM/BTC/TRON.

---

## Phase 4 — Write paths + bridge + migration

1. **Send flow rebuild.** New `SendMultichain` flow in
   `packages/uikit/src/components/transfer/multichain/`. Steps reuse pieces (recipient input,
   amount, review, confirm) but each step delegates to the chain adapter for validation, decimals,
   fee model, and signing. EVM slow/normal/fast, BTC fee-rate UI, Solana priority fee. Sender
   dispatch: `ChainAdapter.signTransaction(...)` → broadcast via
   `mediator.transaction.sendTransaction`.
2. **Insufficient gas / pending tx / invalid address handling.** Per-chain error mapping; UI strings
   localized via `packages/locales`.
3. **Cross-chain swap/bridge.** New parallel screen — _not_ the existing DEX swap. Embed a bridging
   provider (TBD — see [Open question #2](#open-question-2--bridge-provider-for-cross-chain-swap)).
   UX: from-chain+token → to-chain+token → route summary → status (pending → in-progress → completed
   → failed) with retry guidance.
4. **Unified history (Phase 2 of history scope).** Merge per-chain activity into a single list with
   chain badges + filter, sorted by timestamp. Backend likely needs a unified `/v2/activity`
   aggregator — coordinate with BE.
5. **Migration UX.**
    - Banner / entry point for legacy TON accounts.
    - "Create new multichain wallet" sub-flow + backup confirmation.
    - "Move all balances" — derive a multichain account, transfer TON + TRON assets to its addresses
      on respective chains. Track progress under new `MULTICHAIN_MIGRATION_STATE` key. Resumable: on
      app open, check incomplete state and resume from last tx hash.
    - Old wallet stays accessible until user explicitly removes.

**Exit:** Full multichain wallet at feature parity with TON-only on TON + EVM + BTC + TRON.
Migration available. Flag still off in prod for general users.

---

## Phase 5 — Solana, gasless, attestation, launch

1. **Solana.** Slot in once chain-kit ships it; same `ChainAdapter` shape, no UI churn.
2. **Gasless / Battery integration** (if in scope):
    - "Battery available vs user pays gas" UI in send/swap review steps.
    - EVM Account Abstraction (ERC-4337): userOp signing UX, sponsorship/fees display. Coordinate
      with backend on bundler/paymaster contracts.
    - Solana relay sponsored tx states.
3. **Device/app attestation.** New `AttestationService` on `IAppSdk`. Mobile: Capacitor plugin for
   Play Integrity + App Attest. Token plumbed into API request headers. Desktop/extension: stub. See
   [Open question #4](#open-question-4--attestation-timing).
4. **Network fallback messaging.** Per-chain offline detection, user-facing "chain X temporarily
   unavailable" state.
5. **Phased rollout.** Flag flip per app: extension/desktop dev → internal → 1% → 10% → 100%. Mobile
   separate due to App Store review cadence.

**Exit:** Public launch.

---

## Cross-cutting concerns

-   **Localization.** Every new screen ships translation keys into `packages/locales` before flag
    flip. Plan for ~200–300 new strings.
-   **Testing.** Mock chain-kit in unit tests; integration tests hit real testnets only for EVM/BTC
    where they're stable. TON testnet is unreliable — use a throwaway fixture seed for chain-kit
    unit tests too.
-   **Analytics.** New tracker events per chain — define event schema in Phase 2 to avoid
    retrofitting.
-   **Per-app bundle size.** chain-kit WASM is 3–6MB. Set bundle-size CI budgets per app at Phase 0
    and gate on them. Extension and TWA are highest-risk.
-   **`apps/twa`** is out of scope for the first release.
-   **Backwards compatibility.** Legacy `AccountTonMnemonic`/`AccountMAM` paths stay byte-identical.
    The signer factory and contract factory must produce literally the same outputs for these
    accounts as the pre-refactor code. Snapshot-test harness in Phase 1 gates this.

---

## Open question — Attestation timing

**Question:** Will backend _require_ attestation for some endpoints by launch, or is it Phase 5
polish?

**Context:**

-   No attestation scaffolding exists in the codebase today.
-   If backend enforces attestation at launch on, e.g., balance or broadcast endpoints, attestation
    must move earlier (Phase 2 or 3, not Phase 5).
-   Mobile attestation (Play Integrity + App Attest) needs a Capacitor plugin — not trivial.
-   Desktop/extension can stub with a signed timestamp, but backend has to accept that.

**Decision needed from:** backend / security team.

**Recommendation:** Get the backend attestation requirements pinned in Phase 0. If launch-blocking,
promote attestation to Phase 2.

**Decision:**

**Owner:**

**Date:**

---

## Open question — Create-flow default after multichain launch

**Question:** When `multichainEnabled` is on in production, what does "Create wallet" do by default
— and is "Create TON-only wallet" still a user-visible option?

**Context:**

The plan locks in that **legacy import** stays available forever (TON-standard and MAM mnemonics
can't be re-derived from BIP39; users with paper backups need a path in). What it doesn't lock in is
the _create_ flow, where we choose what mnemonic type to mint:

| Option                                                | What "Create wallet" does                                                                                              | Pros                                                       | Cons                                                                                                                                 |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **A — Multichain default, legacy hidden**             | Always creates `AccountMultichain` with BIP39. "Create TON-only wallet" not surfaced in UI. Legacy import still works. | Simple UX. One default. New users get the best experience. | TON-only purists must use Import to land on legacy. Subtle: anyone who creates a wallet post-launch is on BIP39, never TON-standard. |
| **B — Multichain default, legacy as advanced option** | Default is multichain BIP39. "Create TON-only wallet" lives in an advanced/legacy menu.                                | Power users can opt out. Backward feature parity.          | Two creation flows to maintain in UI + docs.                                                                                         |
| **C — User chooses on first run**                     | Onboarding asks "TON-only or multichain" with a recommendation.                                                        | Most transparent.                                          | Adds a step to onboarding; users without context will pick wrong.                                                                    |
| **D — Legacy default, multichain as opt-in**          | "Create wallet" keeps making `AccountTonMnemonic`. Multichain creation is a separate entry point.                      | Lowest risk for existing TON users. Conservative rollout.  | Multichain feels like a sidecar, not the product. Defeats the launch premise.                                                        |

**Adjacent decision — import disambiguation.** Regardless of create-flow default, "Import wallet"
must:

-   Detect TON-standard mnemonic → route to `AccountTonMnemonic` create path. No prompt needed.
-   Detect MAM → route to `AccountMAM`. No prompt needed.
-   Detect BIP39 → **ambiguous**, since a BIP39 seed could equally be a legacy TON-only wallet
    (BIP39 with TON path) or a multichain wallet. Either prompt the user, or default to multichain
    (recommended) and let users with legacy BIP39-TON wallets choose "TON-only" before confirming.

**Recommendation:** Option **A** (multichain default, legacy create hidden from UI) for the launch
UX. Reasoning: legacy paper backups are still imported losslessly; only thing not surfaced is the
ability to _mint_ a TON-only seed post-launch, which is fine — there's no good reason to onboard a
new user onto a TON-only mnemonic when the multichain wallet covers TON identically plus more
chains. If product disagrees, fall back to **B**, not **C** or **D**.

**Decision:**

**Owner:**

**Date:**

---

## Appendix A — Key file locations referenced

-   Account model: `packages/core/src/entries/account.ts`
-   Wallet entries: `packages/core/src/entries/wallet.ts`
-   Mnemonic & TON derivation: `packages/core/src/service/mnemonicService.ts` (TON path hardcoded at
    line 15)
-   Wallet contract factory: `packages/core/src/service/wallet/contractService.ts:24-58`
    (workchain=0 hardcoded at line 20)
-   Signer dispatch: `packages/uikit/src/state/mnemonic.ts:267-433` (157-line switch)
-   AppSdk interface: `packages/core/src/AppSdk.ts`
-   Storage keys: `packages/core/src/Keys.ts`
-   Query keys: `packages/uikit/src/libs/queryKey.ts`
-   AppContext: `packages/uikit/src/hooks/appContext.ts`
-   Mobile storage migration pattern (reuse for multichain migration):
    `apps/mobile/src/libs/storage.ts:86-204`
-   Receive flow (already chain-parameterized):
    `packages/uikit/src/components/home/ReceiveNotification.tsx:33`
-   Send flow root: `packages/uikit/src/components/transfer/`
-   TRON bolt-on (template for what NOT to repeat): `tronWalletByTonMnemonic` in `walletService.ts`

## Appendix B — chain-kit notes

-   Repo: https://github.com/tonkeeper/chain-kit (private, KMP)
-   JS target: Kotlin/JS → wallet-core WASM
-   Local build → `.tgz` via `tools/js/publish-local.sh`
-   API entry: `CryptoKitClient` (not `CryptoCore`)
-   Chain access: `client.blockchain.getMediator(Network.Type)` → `ChainMediator` with
    `account / fee / sign / transaction / node` sub-delegates
-   Required `await ready()` before any chain access
-   Result types: `Res<T,E>` — needs TS facade wrapping
-   Crypto: Trust Wallet Core WASM (~3–6 MB)
-   Solana: placeholder, not implemented
-   EVM L2s in Ethereum module: Arbitrum, Base, Optimism, Mantle (Polygon/BNB not confirmed)
