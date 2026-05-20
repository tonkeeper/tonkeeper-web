# Phase 1 — TON refactor for multichain shape (task breakdown)

Sibling document to `MULTICHAIN_PLAN.md`. Phase 1 is the gate to everything else: strip TON
assumptions from the chokepoints (signer dispatch, wallet contract factory, derivation paths)
without changing any user-visible behavior, then add the scaffolding multichain will plug into in
Phase 2.

**Team:** one developer on web integration. Tracks are sequenced serially below — no parallelism.
**Exit criterion:** All apps build, all existing tests pass, snapshot-test harness shows
byte-identical output for every legacy account type signing every supported TON wallet version.

---

## Track summary & order

Serialized for a single developer. Each track must be complete before the next begins, with two
exceptions noted.

```
  G. Snapshot-test harness    ← lands first, gates B/C/D
            │
  A. chain-kit facade         ← unblocks B/C/D
            │
  B. Signer factory           ← biggest refactor
            │
  C. Wallet contract factory  ← smaller refactor, same pattern as B
            │
  D. Derivation paths config  ← cleanup
            │
  E. useActiveWalletForChain  ← additive
            │
  F. multichainEnabled flag   ← additive
```

**Exceptions:** F (flag plumbing) is so small it can slot in anywhere if you need a context-switch.
E is also additive and can move earlier if convenient — it has no dependencies. But B → C → D must
stay in that order: B establishes the factory pattern that C reuses, and D's tests benefit from B/C
being in place.

---

## Track A — `packages/core/src/chains/` facade

**Depends on:** Phase 0 (chain-kit `.tgz` available in monorepo).

### Goal

Hide chain-kit's Kotlin/JS ergonomics (`Companion.from(...)`, `Res<T,E>`, `await ready()`,
`Int8Array` vs `Uint8Array`) behind a clean TS interface that the rest of `uikit` can use.

### Files to create

| File                                       | Purpose                                                                                                                                                                                                                                                                                  |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/core/src/chains/index.ts`        | Re-exports `ChainAdapter`, `ChainId`, `getAdapter(chain)`.                                                                                                                                                                                                                               |
| `packages/core/src/chains/types.ts`        | `ChainId` enum (`'ton' \| 'evm' \| 'btc' \| 'tron' \| 'sol'`), `ChainAdapter<TMessage, TSignature>` interface, `Address`, `Amount`, `Fee` types in our shape.                                                                                                                            |
| `packages/core/src/chains/ready.ts`        | Singleton `ensureReady()` wrapping chain-kit's `await ready()`. Idempotent. Called by every adapter method.                                                                                                                                                                              |
| `packages/core/src/chains/result.ts`       | `unwrap<T>(res: Res<T,E>): T` helper that throws on `Err`. Centralizes the result-type translation.                                                                                                                                                                                      |
| `packages/core/src/chains/ton/adapter.ts`  | First concrete adapter — wraps existing TON code paths (`walletContract`, `mnemonicToKeypair`, `Cell` signing). Initially this is **just a wrapper around current logic, not chain-kit's TON module**. Switching the TON internals to chain-kit is a follow-up not in scope for Phase 1. |
| `packages/core/src/chains/evm/adapter.ts`  | Stub; methods throw `NotImplemented`. Phase 2/3 fills it in.                                                                                                                                                                                                                             |
| `packages/core/src/chains/btc/adapter.ts`  | Same.                                                                                                                                                                                                                                                                                    |
| `packages/core/src/chains/tron/adapter.ts` | Same. (Existing TRON code in `walletService.ts` is NOT migrated here in Phase 1.)                                                                                                                                                                                                        |
| `packages/core/src/chains/sol/adapter.ts`  | Same; marked clearly as "blocked on chain-kit".                                                                                                                                                                                                                                          |

### `ChainAdapter` interface shape

```ts
export interface ChainAdapter<TMessage = unknown, TSignature = unknown> {
    readonly chain: ChainId;

    deriveAddress(args: { publicKey: Uint8Array; opts?: unknown }): Promise<string>;
    validateAddress(addr: string): boolean;
    formatAmount(amount: bigint, opts?: { decimals?: number }): string;
    parseAmount(human: string, opts?: { decimals?: number }): bigint;

    estimateFee(args: { from: string; to: string; amount: bigint; data?: unknown }): Promise<Fee>;
    buildTransaction(args: BuildTxArgs): Promise<TMessage>;
    signTransaction(args: { message: TMessage; signer: ChainSigner }): Promise<TSignature>;
    broadcast(args: { signed: TSignature }): Promise<{ hash: string }>;
}
```

`ChainSigner` is intentionally generic — see Track B.

### Tasks

-   [ ] **A1.** Add chain-kit `.tgz` dependency to `packages/core/package.json` (or workspace
        alias). Smoke-test `import { ready } from 'chainkit'` resolves and `await ready()` works in
        a unit test.
-   [ ] **A2.** Create directory + index files. Type-check passes empty.
-   [ ] **A3.** Implement `ensureReady()` and `unwrap()`. Unit-tested.
-   [ ] **A4.** Implement `TonAdapter` wrapping current code paths. **Crucial:**
        `TonAdapter.signTransaction` must call into the same signer instance returned by
        `getSigner()` — Track B owns the factory; A4 just adapts the interface.
-   [ ] **A5.** Stub EVM/BTC/TRON/SOL adapters; document blocking issues in JSDoc.
-   [ ] **A6.** `getAdapter(chain: ChainId): ChainAdapter` registry. Throws on unknown chain. Used
        by all downstream code.
-   [ ] **A7.** Tests: unit-test that `getAdapter('ton').validateAddress()` accepts known TON
        addresses and rejects known-bad ones. Use throwaway fixture seed (per project memory — TON
        testnet unreliable).

### Done when

-   `import { getAdapter } from '@tonkeeper/core/dist/chains'` works from `uikit`.
-   `getAdapter('ton')` returns a working adapter; other chains return stubs that throw with a clear
    message.
-   No existing TON behavior is routed through the adapter yet (that's track B → onwards).

---

## Track B — Signer factory extraction

**Depends on:** A (uses `ChainAdapter`), G (snapshot harness gating). **Touches:**
`packages/uikit/src/state/mnemonic.ts:267-433` (the 157-line switch).

### Goal

Replace the inline switch in `getSigner()` with a registry of strategies keyed on
`(account.type, chain)`. Default chain is `'ton'`. TON behavior must be byte-identical (verified by
track G).

### New shape

```ts
// packages/core/src/service/sign/types.ts
export type ChainSigner =
    | { type: 'cell'; sign(msg: Cell): Promise<Buffer> } // TON
    | { type: 'eth-typed'; sign(msg: TypedData): Promise<Hex> } // EVM
    | { type: 'eth-raw'; sign(msg: Bytes): Promise<Hex> }
    | { type: 'btc-psbt'; sign(psbt: Psbt): Promise<Psbt> }
    | { type: 'tron-raw'; sign(msg: Bytes): Promise<Bytes> }
    | { type: 'sol-tx'; sign(msg: Transaction): Promise<Transaction> }
    | { type: 'ledger'; sign(txs: LedgerTransaction[]): Promise<Buffer> };

// packages/core/src/service/sign/factory.ts
export interface SignerFactoryArgs {
    sdk: IAppSdk;
    accountId: AccountId;
    chain: ChainId;
    walletId?: WalletId;
    options?: { shouldCreateMetaKeys?: boolean };
}
export type SignerFactory = (args: SignerFactoryArgs) => Promise<ChainSigner>;
```

### Tasks

-   [ ] **B1.** Move existing `Signer` and `CellSigner` types into
        `packages/core/src/service/sign/types.ts`. Make `ChainSigner` a discriminated union
        containing the old `CellSigner` as the `'cell'` variant. Keep old exports as aliases for one
        PR to avoid touching every consumer simultaneously.
-   [ ] **B2.** Create `packages/core/src/service/sign/registry.ts`:
    ```ts
    type Key = `${Account['type']}:${ChainId}`;
    const registry = new Map<Key, SignerFactory>();
    export function register(key: Key, factory: SignerFactory) { ... }
    export function resolve(args: SignerFactoryArgs): Promise<ChainSigner> { ... }
    ```
-   [ ] **B3.** Extract each `case` from `getSigner()` (lines 282–423) into its own module under
        `packages/core/src/service/sign/strategies/ton/`:
    -   `ton-only-signer.ts` (was `case 'ton-only'`)
    -   `ledger-ton-signer.ts` (was `case 'ledger'`)
    -   `keystone-ton-signer.ts` (was `case 'keystone'`)
    -   `mam-ton-signer.ts` (was `case 'mam'`)
    -   `mnemonic-ton-signer.ts` (was `case 'mnemonic'` / `case 'testnet'`)
    -   `sk-ton-signer.ts` (was `case 'sk'`)
    -   `watch-only-signer.ts` (was `case 'watch-only'`)
    -   `multisig-signer.ts` (was `case 'ton-multisig'`)
-   [ ] **B4.** Register each strategy under its `(account.type, 'ton')` key at module-init time.
-   [ ] **B5.** Replace `getSigner()` body with a single call to
        `resolve({ sdk, accountId, chain: 'ton', walletId, options })`. Original function signature
        unchanged — callers don't touch.
-   [ ] **B6.** Run snapshot-test harness (track G) against the refactored `getSigner()` — must
        produce byte-identical BOCs vs the pre-refactor version.
-   [ ] **B7.** Stub registrations for `(account.type, 'evm' | 'btc' | 'tron' | 'sol')` that throw
        `NotImplemented` with a clear "Phase 2" message. This way callers can already start wiring
        up chain-aware code paths without runtime crashes from missing keys.
-   [ ] **B8.** Move `getTronSigner()` (line 435+) into `strategies/tron/legacy-tron-signer.ts` but
        **keep it called via the existing TRON code paths** — don't unify with the new factory yet.
        Phase 3 replaces TRON.

### Risk callouts

-   **MAM secret retrieval** (`getMAMWalletMnemonic`) and `getAccountSecret` are reused across
    strategies. Don't duplicate them — keep them as shared helpers in
    `packages/core/src/service/sign/secrets.ts`.
-   **Meta-encryption keys** (`createAndStoreMetaEncryptionKeys`) are a side effect of the `'mam'`
    and `'mnemonic'` cases. Preserve the `shouldCreateMetaKeys` flag plumbing exactly — silent
    regression risk.
-   **`signer-deeplink` web vs non-web branch** (lines 296–338) is platform-dependent and the most
    surprising path. Snapshot-test it on both targets.

### Done when

-   `mnemonic.ts:getSigner()` shrinks from ~165 lines to ~20.
-   All existing signing call sites work unchanged.
-   Snapshot harness passes for every `(account.type, ton)` × every supported `WalletVersion`.

---

## Track C — Wallet contract factory

**Depends on:** A, G. **Touches:** `packages/core/src/service/wallet/contractService.ts`.

### Goal

Replace the hardcoded `walletContract()` switch (lines 24–58) with a per-chain strategy. TON keeps
its existing `WalletContractVxxx` path; other chains stub out and throw.

### Tasks

-   [ ] **C1.** Create `packages/core/src/service/wallet/contracts/types.ts` with
        `WalletContractStrategy<TWallet>` interface:
    ```ts
    export interface WalletContractStrategy<TWallet = unknown> {
        chain: ChainId;
        create(args: { wallet: TWallet; network: Network }): WalletContractLike;
    }
    ```
    `WalletContractLike` is the minimal interface today's TON code uses (`address`, `init`,
    `createTransfer`, `createRequest` for V5).
-   [ ] **C2.** Move the existing TON switch into
        `packages/core/src/service/wallet/contracts/ton-strategy.ts`. Move the `const workchain = 0`
        constant into this module — out of the top-level file.
-   [ ] **C3.** Create a registry similar to track B's: `register(chain, strategy)`,
        `getStrategy(chain)`.
-   [ ] **C4.** Replace `walletContractFromState()` body with a delegation to
        `getStrategy(wallet.network === Network.TESTNET ? 'ton' : 'ton').create(...)` — note
        `network` is now an arg, not a global assumption.
-   [ ] **C5.** Stub EVM/BTC/TRON/SOL strategies that throw `NotImplemented`.
-   [ ] **C6.** Run snapshot harness — every `(WalletVersion, Network)` combo must produce identical
        state-init BOCs.

### Risk callouts

-   `walletStateInitFromState()` (line 60) calls into `walletContractFromState()`. Verify it still
    works (it should — same delegation).
-   `estimateWalletContractExecutionGasFee()` (line 76+) uses `WalletVersion` directly. Leave it
    untouched in Phase 1 — it's TON-specific by design; move to TON strategy in Phase 2.

### Done when

-   `contractService.ts` top-level file is ~30 lines (delegation only).
-   TON snapshot harness identical pre/post.
-   Other chains stub clearly.

---

## Track D — Derivation paths config

**Depends on:** A. **Touches:** `packages/core/src/service/mnemonicService.ts:15`,
`packages/core/src/service/ed25519.ts` consumers.

### Goal

The string `"m/44'/607'/0'"` is hardcoded twice in `mnemonicService.ts` (lines 15, 114, 154). Move
into a per-chain config map; existing TON paths unchanged.

### Tasks

-   [ ] **D1.** Create `packages/core/src/chains/derivation.ts`:
    ```ts
    export const DEFAULT_BIP44_PATH: Record<ChainId, string> = {
      ton: "m/44'/607'/0'",
      evm: "m/44'/60'/0'/0/0",
      btc: "m/84'/0'/0'/0/0",      // bech32 / native segwit
      tron: "m/44'/195'/0'/0/0",
      sol: "m/44'/501'/0'/0'"
    };
    export function pathFor(chain: ChainId, index = 0): string { ... }
    ```
-   [ ] **D2.** Update `bip39ToPrivateKey()` (line 112) to accept a path arg, defaulting to
        `pathFor('ton')`. Existing callers keep working.
-   [ ] **D3.** Update `bip39MnemonicToEd25519Seed()` (line 152) the same way.
-   [ ] **D4.** Add unit tests: derivation from a fixture BIP39 seed produces known TON address
        (regression test).
-   [ ] **D5.** Document in a JSDoc that EVM/BTC/SOL **will not** go through these ed25519-specific
        helpers — they have their own curves. The path map is shared but the derivation function is
        per-chain.

### Risk callouts

-   Existing TRON derivation uses `m/44'/195'/0'/0` (no terminal `/0`). Confirm with chain-kit which
    BIP44 convention is canonical before changing — non-trivial backwards compat risk.

### Done when

-   No string `"m/44'/607'/0'"` outside `derivation.ts` (grep check in CI).
-   TON address derivation byte-identical to pre-refactor (unit-tested with fixture seed).

---

## Track E — `useActiveWalletForChain(chain)` hook

**Depends on:** nothing. **Touches:** `packages/uikit/src/state/wallet.ts`.

### Goal

Add a new hook that returns the active wallet for a given chain. For legacy accounts
(`AccountTonMnemonic`, `AccountMAM`, etc.), this is a thin wrapper around `useActiveWallet()` and
returns the TON wallet unchanged. Unused in production yet — sets up Phase 2 consumers.

### Tasks

-   [ ] **E1.** Add `useActiveWalletForChain(chain: ChainId)` in
        `packages/uikit/src/state/wallet.ts`. Returns
        `TonWalletStandard | EvmWallet | BtcWallet | TronWallet | SolWallet | undefined`.
-   [ ] **E2.** For legacy account types, implement:
        `chain === 'ton' ? useActiveWallet() : undefined`.
-   [ ] **E3.** Add `useActiveWalletForChain('ton')` as an alias in unit tests verifying parity with
        `useActiveWallet()`.
-   [ ] **E4.** **Do not** migrate any callers yet. Adding the hook is the entire scope; Phase 2/3
        will migrate components one-by-one.

### Done when

-   New hook exists, tested, but called nowhere in production code.
-   Storybook (if used) shows it returning expected values for fixture accounts.

---

## Track F — `multichainEnabled` AppContext flag

**Depends on:** nothing. **Touches:** `packages/uikit/src/hooks/appContext.ts`, root component of
each of the 4 apps.

### Tasks

-   [ ] **F1.** Add `multichainEnabled: boolean` to `IAppContext` in
        `packages/uikit/src/hooks/appContext.ts`.
-   [ ] **F2.** In each app's root component, source the value:
    -   `apps/web` — from `import.meta.env.VITE_MULTICHAIN_ENABLED`
    -   `apps/desktop` — from Electron main process config (passed via IPC at startup) OR same Vite
        env
    -   `apps/extension` — from a constant in `apps/extension/src/config.ts`
    -   `apps/mobile` — from Capacitor config or Vite env
-   [ ] **F3.** Default to `false` everywhere except local dev (`.env.local`).
-   [ ] **F4.** No UI consumers yet. Just plumbing.

### Done when

-   `useAppContext().multichainEnabled` returns `false` in all production builds, `true` when dev
    opts in.

---

## Track G — Snapshot-test harness (gate)

**Must land first.** Without it, every subsequent track is doing surgery on a signing chokepoint
with no regression net.

### Goal

Before any refactor, capture a snapshot of every signer × every wallet version × every account type
producing a known signed BOC against a fixture mnemonic. Then re-run after each Phase 1 PR and fail
on any byte difference.

### Tasks

-   [ ] **G1.** Create `packages/core/src/__tests__/snapshots/sign/` directory.
-   [ ] **G2.** Fixtures: 5 BIP39 mnemonics (one per account type that supports mnemonic input —
        `mnemonic`, `mam`, `sk`, `testnet`, and a synthetic `ton-only` case using a recorded signer
        response). Stored as hardcoded constants — never use real funds.
-   [ ] **G3.** For each fixture × `WalletVersion` (V3R1, V3R2, V4R2, V5_BETA, V5R1) × Network
        (MAINNET, TESTNET), pre-compute a signed transfer of a fixed canonical message. Store BOCs
        as base64 in `snapshots/sign/<combo>.json`.
-   [ ] **G4.** Test runner: load fixture, call `getSigner()` (and after refactor, the new factory),
        assert output equals snapshot.
-   [ ] **G5.** Ledger and Keystone are skipped (require hardware) — mock the pairing calls and
        snapshot the _call shape_ (`path`, `transactions[]` payload) instead of the signature.
-   [ ] **G6.** Wire into CI (yarn workspace `@tonkeeper/core test`); make Phase 1 PRs auto-fail if
        snapshots diverge.

### Risk callouts

-   Snapshots include the message-hash signature. Ed25519 signing on the same seed + same message is
    deterministic, so this works. Verify in G3 that re-running produces identical output before
    committing snapshots.
-   V5 contracts use `walletId.networkGlobalId` — make sure that's in the canonical input so
    testnet/mainnet are properly distinguished.

### Done when

-   A green CI run on `main` with the snapshot harness passing.
-   Any subsequent PR that changes signing output fails the snapshot test by default. (Updates
    require an explicit `--update-snapshots` commit step, reviewed by 2 engs.)

---

## Milestones (not calendar)

Track progress by milestone, not week. Each milestone gates the next; don't skip.

1. **M1 — Harness in place.** Track G complete: snapshot harness running green on main against
   current code. Pinned baseline.
2. **M2 — Facade ready.** Track A complete: chain-kit `.tgz` resolves; `getAdapter('ton')` returns a
   working adapter; other chains stub clearly.
3. **M3 — Signer factory.** Track B complete: `getSigner()` is delegation-only (~20 lines); all
   snapshot tests green; manual smoke-test of TON send on all 4 apps passes.
4. **M4 — Contract factory.** Track C complete: `walletContract()` is delegation-only; snapshots
   still green.
5. **M5 — Paths centralized.** Track D complete: `m/44'/607'/0'` appears in exactly one file;
   derivation regression test green.
6. **M6 — New scaffolding.** Tracks E + F complete: hook + flag plumbed but unused in prod.
7. **M7 — Phase 1 exit review.** Full app suite green on all 4 target apps; manual smoke test of
   send/receive/swap/buy on TON mainnet for each app; bundle size delta within agreed Phase 0
   budget. Sign-off before Phase 2 begins.

---

## Phase 1 exit checklist

-   [ ] All 4 target apps (web, desktop, extension, mobile) build green.
-   [ ] All existing unit tests pass.
-   [ ] Snapshot-test harness green for all `(account.type, WalletVersion, Network)` combos.
-   [ ] `getSigner()` is delegation-only (~20 lines).
-   [ ] `walletContract()` is delegation-only.
-   [ ] `m/44'/607'/0'` appears in exactly one file (`derivation.ts`).
-   [ ] `useActiveWalletForChain('ton')` returns the same wallet as `useActiveWallet()` for legacy
        accounts.
-   [ ] `multichainEnabled` flag plumbed; `false` in all prod builds.
-   [ ] `getAdapter('ton')` returns a working adapter; other chains throw `NotImplemented` clearly.
-   [ ] No user-visible changes in any app (manual smoke test of send/receive/swap/buy on TON
        mainnet for each app).
-   [ ] Bundle size delta per app documented and within agreed budget.

---

## Out of scope for Phase 1

These are tempting cleanups but explicitly **deferred** to keep Phase 1 mechanical:

-   Moving TRON code into the new adapter shape (Phase 3 replaces TRON entirely).
-   Changing `useActiveWallet()` callers to `useActiveWalletForChain('ton')` (Phase 2/3 migrates).
-   Switching the TON internals to chain-kit's TON module (Phase 2+ — keep using `@ton/ton` for
    now).
-   Multisig signer migration (`AccountTonMultisig` stays special-cased).
-   Adding `AccountMultichain` to the union (Phase 2).
-   Removing `CellSigner` (it becomes the `'cell'` variant of `ChainSigner` and stays).
