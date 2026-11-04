/**
 * Solana wallet entry held inside an `AccountMultichain`.
 *
 * The shape exists unconditionally so storage and union narrowing don't
 * need to change later. Whether it's ever populated depends on chain-kit
 * shipping a Solana module; without one, `'sol'` is excluded from a new
 * `AccountMultichain`'s `enabledChains`.
 *
 * `rawAddress` is the base58-encoded ed25519 public key (32 bytes →
 * 43–44 base58 chars; Solana addresses *are* the public key).
 *
 * `publicKey` is hex-encoded ed25519 public key. Redundant with
 * `rawAddress` in encoding-but-not-bytes, kept for cross-chain symmetry.
 *
 * Derivation: BIP-44 over ed25519 via SLIP-0010 at
 * `DEFAULT_BIP44_PATH.sol` (`m/44'/501'/0'/0'`).
 */
export type SolWallet = {
    id: string;
    chain: 'sol';
    rawAddress: string;
    publicKey: string;
    derivationPath: string;
};
