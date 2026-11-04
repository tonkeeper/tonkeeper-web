import { secp256k1 } from '@noble/curves/secp256k1';
import { HDNodeWallet } from 'ethers';
import { mnemonicToSeed } from 'bip39';

import {
    base32LowerNoPad,
    base64UrlDecode,
    base64UrlEncodeNoPad,
    blake2b160,
    blake2b256,
    bytesToHex,
    concatBytes,
    hexToBytes,
    lp,
    utf8
} from './proofPrimitives';
import { DeviceAuthService } from './deviceAuthService';
import { multichainApiOrigin } from '../multichainEndpoints';

/**
 * Wallet-scoped authentication against the multichain backend, mirroring
 * chain-kit's `WalletProofHelper` / `WalletAuth` byte for byte (see the
 * cross-language vectors in `WalletRegisterProofTest.kt`, reproduced in
 * this module's tests).
 *
 * The wallet root key is secp256k1, derived from the BIP39 seed at a
 * fixed hardened path shared by all platforms. It never spends funds —
 * no chain derives spending keys from this path — it only proves wallet
 * ownership: the format-2 wallet id commits to its public key, and both
 * the register proof and the per-session `X-Wallet-Authorization` token
 * are recoverable signatures the backend resolves back to that id.
 */

const walletsUrl = (route: 'challenge' | 'register'): string =>
    `${multichainApiOrigin()}/api/v2/wallets/${route}`;

const WALLET_ID_DOMAIN = 'keeper.wallet.id.v2';
const WALLET_REGISTER_DOMAIN = 'keeper.wallet.register.v2';
const WALLET_AUTH_DOMAIN = 'keeper.wallet.auth.v1';

const WALLET_ID_FORMAT = 2;
/** `WalletKind.Multichain` — the only kind the web creates. */
const WALLET_KIND = 'multichain';
const WALLET_KIND_BYTE = 1;

/**
 * The shared wallet-auth derivation path (chain-kit
 * `WALLET_ID_DERIVATION_PATH`). Opaque constant — all hardened, disjoint
 * from every spending path.
 */
const WALLET_AUTH_DERIVATION_PATH = "13'/1776705466'/1544400681'/308602604'/184076019'";

/** Matches only well-formed format-2 multichain ids (`0x02 0x01 …` → `ai…`, padding zero → `a|q`). */
export const isMultichainWalletIdV2 = (walletId: string | undefined): walletId is string =>
    walletId !== undefined && /^ai[a-z2-7]{33}[aq]$/.test(walletId);

export interface MultichainApiWalletCredentials {
    walletId: string;
    walletAuthKey?: string;
}

/**
 * The credentials a multichain REST call needs, or `undefined` when the
 * account can't talk to the backend: not a multichain account, or one
 * whose stored id predates format 2 — the backend rejects legacy ids, so
 * those accounts degrade exactly like accounts with no id at all until a
 * re-import upgrades them.
 */
export const multichainApiWalletCredentials = (account: {
    type: string;
    multichainWalletId?: string;
    walletAuthKey?: string;
}): MultichainApiWalletCredentials | undefined => {
    if (account.type !== 'multichain' || !isMultichainWalletIdV2(account.multichainWalletId)) {
        return undefined;
    }
    return { walletId: account.multichainWalletId, walletAuthKey: account.walletAuthKey };
};

export interface MultichainWalletAuthCredentials {
    /** Format-2 wallet id, 36 chars base32. */
    walletId: string;
    /** Root secp256k1 private key, 32 bytes hex. */
    walletAuthKey: string;
}

/**
 * Derive the wallet root keypair and its format-2 id from the BIP39
 * mnemonic. Standard BIP39 seed (empty passphrase), BIP32 secp256k1 at
 * the shared hardened path.
 */
export const deriveMultichainWalletAuth = async (
    mnemonic: string[]
): Promise<MultichainWalletAuthCredentials> => {
    const seed = await mnemonicToSeed(mnemonic.join(' '));
    const node = HDNodeWallet.fromSeed(seed).derivePath(WALLET_AUTH_DERIVATION_PATH);
    const publicKey = hexToBytes(node.publicKey.slice(2));
    return {
        walletId: computeMultichainWalletIdV2(publicKey),
        walletAuthKey: node.privateKey.slice(2)
    };
};

/**
 * `base32(format ‖ kind_byte ‖ blake2b160(LP(domain) ‖ LP(kind) ‖ LP(root_pub)))`
 * — 22 bytes, 36 chars, always `ai…` for a multichain wallet.
 */
export const computeMultichainWalletIdV2 = (compressedPublicKey: Uint8Array): string => {
    const message = concatBytes(
        lp(utf8(WALLET_ID_DOMAIN)),
        lp(utf8(WALLET_KIND)),
        lp(compressedPublicKey)
    );
    return base32LowerNoPad(
        concatBytes(new Uint8Array([WALLET_ID_FORMAT, WALLET_KIND_BYTE]), blake2b160(message))
    );
};

/**
 * 65-byte compact recoverable secp256k1 signature (`R ‖ S ‖ V`, low-S,
 * EVM recovery-id ordering) over blake2b-256 of the LP-framed message.
 * Both the register proof and the auth token use this scheme — the
 * backend recovers the public key and re-derives the wallet id from it.
 */
const signRecoverable = (walletAuthKey: string, message: Uint8Array): Uint8Array => {
    const signature = secp256k1.sign(blake2b256(message), hexToBytes(walletAuthKey), {
        lowS: true
    });
    return concatBytes(signature.toCompactRawBytes(), new Uint8Array([signature.recovery]));
};

/**
 * Mint the `X-Wallet-Authorization` value for one device access token:
 * `base64url_nopad(sign(LP("keeper.wallet.auth.v1") ‖ LP(blake2b256(utf8(jwt)))))`.
 * The JWS is committed to verbatim — dots and all — so the token is
 * worthless against any other session.
 */
export const mintWalletAuthToken = (walletAuthKey: string, accessToken: string): string => {
    const message = concatBytes(lp(utf8(WALLET_AUTH_DOMAIN)), lp(blake2b256(utf8(accessToken))));
    return base64UrlEncodeNoPad(signRecoverable(walletAuthKey, message));
};

/**
 * One account row of the register payload. `network` is omitted on the
 * wire (the server normalizes to `mainnet`) but always present in the
 * digest. `type` is only for chains with several canonical forms — TON
 * `v4R2`/`v5R1`, BTC `p2wpkh`/`p2tr` — and the key is omitted entirely
 * when absent, never sent empty.
 */
export interface MultichainRegisterAccount {
    address: string;
    chain: string;
    type?: string;
}

/**
 * `blake2b256` over the compact JSON of `{address, chain, network, type?}`
 * rows sorted by `(address, chain, network, type)` — the canonical form
 * both the client proof and the server verifier compute independently.
 */
export const canonicalAccountsDigest = (accounts: MultichainRegisterAccount[]): Uint8Array => {
    const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
    const entries = accounts
        .map(a => ({ address: a.address, chain: a.chain, network: 'mainnet', type: a.type }))
        .sort(
            (x, y) =>
                cmp(x.address, y.address) ||
                cmp(x.chain, y.chain) ||
                cmp(x.network, y.network) ||
                cmp(x.type ?? '', y.type ?? '')
        )
        .map(({ address, chain, network, type }) =>
            type === undefined ? { address, chain, network } : { address, chain, network, type }
        );
    return blake2b256(utf8(JSON.stringify(entries)));
};

/**
 * The `wallet_proof` for one register item:
 * `sign(LP(domain) ‖ LP(wallet_id) ‖ LP(device_id) ‖ LP(challenge_bytes) ‖ LP(accounts_digest))`,
 * lowercase hex. The challenge is framed as its decoded 73 bytes, not
 * the base64url string.
 */
export const signWalletRegisterProof = (
    credentials: MultichainWalletAuthCredentials,
    args: { deviceId: string; challenge: string; accounts: MultichainRegisterAccount[] }
): string => {
    const message = concatBytes(
        lp(utf8(WALLET_REGISTER_DOMAIN)),
        lp(utf8(credentials.walletId)),
        lp(utf8(args.deviceId)),
        lp(base64UrlDecode(args.challenge)),
        lp(canonicalAccountsDigest(args.accounts))
    );
    return bytesToHex(signRecoverable(credentials.walletAuthKey, message));
};

interface WalletRegisterResult {
    index: number;
    status: 'ok' | 'failed';
    wallet_id?: string;
    error?: string;
}

/**
 * Bind the wallet to the calling device: fetch a wallet challenge, sign
 * the register proof, and POST the single-item batch. Requires a device
 * session — wallet-scoped reads only answer for wallets bound to the
 * device presenting the JWT. Throws when no session can be established
 * or the backend rejects the item.
 */
export const registerMultichainWallet = async (
    session: DeviceAuthService,
    credentials: MultichainWalletAuthCredentials,
    accounts: MultichainRegisterAccount[],
    fetchImpl: typeof fetch = fetch
): Promise<void> => {
    const info = await session.getSessionInfo();
    if (!info) {
        throw new Error('multichain wallet register: no device session');
    }

    const challengeResponse = await fetchImpl(walletsUrl('challenge'), {
        headers: { Authorization: `Bearer ${info.accessToken}` }
    });
    if (!challengeResponse.ok) {
        throw new Error(`multichain wallet challenge failed: ${challengeResponse.status}`);
    }
    const { challenge }: { challenge: string } = await challengeResponse.json();

    const proof = signWalletRegisterProof(credentials, {
        deviceId: info.deviceId,
        challenge,
        accounts
    });

    const response = await fetchImpl(walletsUrl('register'), {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${info.accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            challenge,
            wallets: [
                {
                    wallet_id: credentials.walletId,
                    wallet_proof: proof,
                    accounts: accounts.map(a =>
                        a.type === undefined
                            ? { address: a.address, chain: a.chain }
                            : { address: a.address, chain: a.chain, type: a.type }
                    )
                }
            ]
        })
    });
    if (!response.ok) {
        throw new Error(`multichain wallet register failed: ${response.status}`);
    }
    const { results }: { results: WalletRegisterResult[] } = await response.json();
    const result = results?.[0];
    if (!result || result.status !== 'ok' || result.wallet_id !== credentials.walletId) {
        throw new Error(
            `multichain wallet register rejected: ${result?.error ?? 'malformed response'}`
        );
    }
};
