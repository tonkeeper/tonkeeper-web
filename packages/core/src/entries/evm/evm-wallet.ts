/**
 * Ethereum / EVM-chain wallet entry held inside an `AccountMultichain`.
 *
 * `rawAddress` is EIP-55 checksummed (`0x` lowercase prefix + mixed-case
 * hex body). Consumers comparing addresses cross-system should
 * lowercase first.
 *
 * `publicKey` is hex-encoded secp256k1 — uncompressed (`04` || X || Y),
 * 65 bytes / 130 hex chars after the `04` prefix. This is the form
 * ethers / Trust Wallet Core round-trip with.
 *
 * `derivationPath` is the BIP-44 path used to derive the keys from a
 * BIP39 seed (default `DEFAULT_BIP44_PATH.evm` = m/44'/60'/0'/0/0).
 */
export type EvmWallet = {
    id: string;
    chain: 'evm';
    rawAddress: string;
    publicKey: string;
    derivationPath: string;
};
