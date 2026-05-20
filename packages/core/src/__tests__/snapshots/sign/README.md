# Signer snapshot harness — Phase 1 / Track G

This directory holds the regression net for the Phase 1 refactor of `getSigner()`
(uikit/state/mnemonic.ts) and `walletContract()` (core/service/wallet/contractService.ts).

## What it covers

For each fixture × wallet version × network combo, the harness reproduces the dispatch in
`getSigner()` using only core APIs and snapshots the resulting signed transfer BOC.

| Fixture          | Mirrors `account.type`                           |
| ---------------- | ------------------------------------------------ |
| `mnemonic-ton`   | `mnemonic` with `mnemonicType: 'ton'`            |
| `mnemonic-bip39` | `mnemonic` with `mnemonicType: 'bip39'`          |
| `testnet`        | `testnet` (same dispatch as mnemonic-ton)        |
| `mam`            | `mam` (TonKeychainRoot child index 0)            |
| `sk`             | `sk` with `signingAlgorithm: 'ed25519'`          |
| `ton-only`       | `ton-only` (uses a deterministic mock signature) |

Combinations: 6 fixtures × 5 versions (V3R1, V3R2, V4R2, V5_BETA, V5R1) × 2 networks (MAINNET,
TESTNET) = 60 BOC snapshots, plus a `ledger-call-shapes.json` for the Ledger derivation-path
mapping.

Watch-only and multisig signers are excluded — they can't produce a signature locally.

## How it works

`harness.ts` resolves each fixture into `(publicKey, CellSigner)`, builds a
`walletContract(publicKey, version, network)`, and calls
`contract.createTransfer({ seqno: 0, signer, timeout, messages, sendMode })` with the canonical
message from `fixtures.ts`. Ed25519 signing is deterministic, so the resulting BOC is reproducible
byte-for-byte.

After the Track B/C refactor, the new factory should funnel through the same primitives; if it does,
the BOCs match and the tests pass.

## Updating snapshots

```sh
UPDATE_SNAPSHOTS=1 yarn workspace @tonkeeper/core test \
  src/__tests__/snapshots/sign/sign.test.ts
```

Updating any committed snapshot requires explicit reviewer approval — the whole point of the harness
is to catch unintended drift. Reviewers should ask: _what change in this PR justifies the new
bytes?_

## Fixtures are throwaway

Every seed, mnemonic, and secret key here is intentionally public and must never be funded. The
BIP39 vector `"abandon abandon ... about"` is the canonical test vector documented in BIP39 itself;
any wallet derived from it would be drained instantly.
