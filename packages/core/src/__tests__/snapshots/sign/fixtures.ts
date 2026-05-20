/**
 * Fixtures for the signer snapshot harness (Phase 1 / Track G).
 *
 * WARNING: every seed and secret in this file is intentionally public and
 * throwaway. Never fund any wallet derived from these values — they would be
 * drained immediately.
 *
 * The harness uses these fixtures to lock down byte-identical signed BOCs
 * across the Phase 1 refactor of `getSigner()` (mnemonic.ts → factory) and
 * `walletContract()` (contractService.ts → strategy registry).
 */

import { Network } from '../../../entries/network';
import { WalletVersion } from '../../../entries/wallet';

/** TON-standard 24-word mnemonic. Generated once via `mnemonicNew(24)`. */
export const FIXTURE_TON_MNEMONIC = [
    'orbit',
    'before',
    'frozen',
    'elbow',
    'lottery',
    'rain',
    'fence',
    'reward',
    'recipe',
    'input',
    'surprise',
    'rail',
    'neck',
    'orchard',
    'pool',
    'defense',
    'pupil',
    'protect',
    'bind',
    'thought',
    'accuse',
    'primary',
    'ivory',
    'quick'
];

/**
 * Canonical BIP39 test vector — every wallet on earth knows this seed is
 * not a real seed, which is exactly what we want for a fixture.
 */
export const FIXTURE_BIP39_MNEMONIC = [
    'abandon',
    'abandon',
    'abandon',
    'abandon',
    'abandon',
    'abandon',
    'abandon',
    'abandon',
    'abandon',
    'abandon',
    'abandon',
    'about'
];

/**
 * MAM root mnemonic. TonKeychainRoot's validator only accepts a TON-standard
 * 24-word phrase whose hmac digest meets an extra filter — this one was
 * generated via `TonKeychainRoot.generate()` and baked here.
 */
export const FIXTURE_MAM_ROOT_MNEMONIC = [
    'snack',
    'wheat',
    'access',
    'artist',
    'shop',
    'share',
    'express',
    'quit',
    'pull',
    'announce',
    'chaos',
    'wash',
    'stool',
    'mouse',
    'scan',
    'hockey',
    'burst',
    'party',
    'reduce',
    'modify',
    'divorce',
    'decrease',
    'mass',
    'aunt'
];

/**
 * The MAM child index to derive for the snapshot. Index 0 is the default.
 */
export const FIXTURE_MAM_CHILD_INDEX = 0;

/** A 32-byte ed25519 seed (64 hex chars). */
export const FIXTURE_SK_ED25519_SEED =
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

/**
 * Synthetic `ton-only` (signer-by-QR / signer-deeplink) fixture: a fixed
 * 32-byte public key and a fixed 64-byte mock signature. The dispatch for
 * ton-only never derives a keypair locally — it calls out to a hardware /
 * QR signer — so the snapshot locks in the *transfer cell shape* given a
 * deterministic mock signature.
 */
export const FIXTURE_TON_ONLY_PUBLIC_KEY_HEX =
    'aaaaaaaabbbbbbbbccccccccddddddddeeeeeeeeffffffff0000000011111111';

export const FIXTURE_TON_ONLY_MOCK_SIGNATURE = Buffer.from(
    '11'.repeat(32) + '22'.repeat(32),
    'hex'
);

/**
 * Canonical transfer parameters used for every snapshot. All values are
 * fixed so the resulting signed BOC is reproducible.
 */
export const CANONICAL_TRANSFER = {
    /** Always-zero seqno so we don't depend on chain state. */
    seqno: 0,
    /** Fixed timeout — `Math.floor(timestamp + ttl)` shape, but constant. */
    timeout: 1_700_000_000,
    /**
     * Recipient: workchain 0, all-zero account. Stored as raw form so the
     * fixture doesn't depend on the friendly-encoding bounceable/testnet flags.
     */
    toAddressRaw: '0:0000000000000000000000000000000000000000000000000000000000000000',
    /** Value: 1 TON, in nanoTON, as a bigint. */
    valueNano: 1_000_000_000n,
    /** Body: a fixed UTF-8 comment encoded as a TON text-comment cell. */
    comment: 'tonkeeper-snapshot-harness-v1'
} as const;

/**
 * All wallet versions the snapshot covers. V4R1 is excluded because the
 * contract factory has always rejected it.
 */
export const SNAPSHOT_WALLET_VERSIONS: ReadonlyArray<WalletVersion> = [
    WalletVersion.V3R1,
    WalletVersion.V3R2,
    WalletVersion.V4R2,
    WalletVersion.V5_BETA,
    WalletVersion.V5R1
];

export const SNAPSHOT_NETWORKS: ReadonlyArray<Network> = [Network.MAINNET, Network.TESTNET];

export const walletVersionName = (v: WalletVersion): string => {
    switch (v) {
        case WalletVersion.V3R1:
            return 'V3R1';
        case WalletVersion.V3R2:
            return 'V3R2';
        case WalletVersion.V4R1:
            return 'V4R1';
        case WalletVersion.V4R2:
            return 'V4R2';
        case WalletVersion.V5_BETA:
            return 'V5_BETA';
        case WalletVersion.V5R1:
            return 'V5R1';
    }
};

export const networkName = (n: Network): string => (n === Network.MAINNET ? 'MAINNET' : 'TESTNET');
