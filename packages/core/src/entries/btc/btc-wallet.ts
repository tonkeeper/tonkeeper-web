/**
 * Bitcoin wallet entry held inside an `AccountMultichain`.
 *
 * Derives from a BIP39 seed at `DEFAULT_BIP44_PATH.btc`
 * (`m/84'/0'/0'/0/0` — BIP-84 native segwit, the default).
 *
 * `rawAddress` is the bech32 string (e.g. `bc1q...`). Taproot (BIP-86)
 * support would add a sibling wallet entry with a different
 * `derivationPath`, not a different `rawAddress` shape — bech32m is also
 * representable here.
 *
 * `publicKey` is hex-encoded secp256k1 *compressed* (33 bytes / 66 hex
 * chars, `02`/`03` prefix). Differs from EVM's uncompressed form; both
 * curves match (secp256k1), only the encoding differs.
 */
export type BtcWallet = {
    id: string;
    chain: 'btc';
    rawAddress: string;
    publicKey: string;
    derivationPath: string;
};
