import { ChainId } from './types';

/**
 * Canonical BIP-44 derivation paths per chain. TON uses SLIP-0044 coin type
 * 607 with a hardened account index and no terminal change/index leaf (its
 * `walletContract()` already encodes the wallet version + workchain). EVM,
 * BTC and TRON follow the standard BIP-44 layout (m / purpose' / coin' /
 * account' / change / index). Solana uses the ed25519-on-Sol layout
 * (account-only, all-hardened, no change/index).
 *
 * The *path* shape is shared by every chain, but the *derivation function*
 * is curve-specific. TON walks the path with `deriveED25519Path`
 * (ed25519); EVM and BTC need secp256k1; Solana needs
 * ed25519-with-SLIP-0010; and TRON's legacy code uses its own ethers.js
 * HD walk (`service/walletService.ts:tonMnemonicToTronMnemonic`).
 * Consumers of this map go through their own per-chain derivation
 * helpers.
 */
export const DEFAULT_BIP44_PATH: Record<ChainId, string> = {
    ton: "m/44'/607'/0'",
    evm: "m/44'/60'/0'/0/0",
    btc: "m/84'/0'/0'/0/0",
    tron: "m/44'/195'/0'/0/0",
    sol: "m/44'/501'/0'/0'"
};

/**
 * Resolve the derivation path for `chain`. Only `index === 0` is
 * supported today; TON returns its fixed account path regardless.
 * Non-zero indices throw early so callers wiring multi-account code
 * paths get a clear failure instead of a silently-wrong derivation.
 */
export const pathFor = (chain: ChainId, index = 0): string => {
    if (index !== 0) {
        throw new Error(
            `pathFor(${chain}, ${index}): non-zero account indices are not supported. ` +
                'Only the default account (index 0) is derived.'
        );
    }
    return DEFAULT_BIP44_PATH[chain];
};
