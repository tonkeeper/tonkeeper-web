/**
 * TRON wallet entry held inside an `AccountMultichain`. Sibling of
 * `EvmWallet` / `BtcWallet` / `SolWallet` — same chain-tagged shape,
 * symmetric narrowing via `chain === 'tron'`.
 *
 * Deliberately separate from the legacy `TronWallet` (`{id, address}`)
 * in `./tron-wallet.ts`. The legacy type is a minimal bolt-on attached
 * to `AccountTonMnemonic` / `AccountMAM` via `DerivationItem.tronWallet`
 * and produced by `tronWalletByTonMnemonic`
 * (`packages/core/src/service/walletService.ts`). Splitting keeps the
 * legacy type byte-and-bit unchanged while letting multichain TRON look
 * like every other chain entry.
 *
 * Multichain TRON derives at canonical `DEFAULT_BIP44_PATH.tron`
 * (`m/44'/195'/0'/0/0`). The legacy bolt-on still uses non-canonical
 * `m/44'/195'/0'/0` (no terminal `/0`) — the two paths produce different
 * addresses and that's expected.
 *
 * `rawAddress` is the base58 TRON address (e.g. `TXY...`). `publicKey`
 * is hex-encoded secp256k1 compressed (33 bytes / 66 hex chars).
 */
export type MultichainTronWallet = {
    id: string;
    chain: 'tron';
    rawAddress: string;
    publicKey: string;
    derivationPath: string;
};
