/**
 * Builds the one thing wallet data leaves this origin as: a snapshot of an
 * agreed set of storage keys, sealed to the ephemeral key of the new origin's
 * tab that asked for it.
 *
 *   ECDH P-256 (fresh sender key × the tab's key)
 *     → HKDF-SHA256, salt = the tab's nonce, info = protocol + both origins
 *     → AES-256-GCM, the payload's header as associated data
 *
 * The transport (`channel.ts`) proves who is talking; the seal keeps the
 * payload readable by that one tab alone. The nonce salting the key makes a
 * payload answer one request only, and naming both origins in the derivation
 * means a payload sealed for any other pair can't be opened. The receiving side is
 * `apps/web/src/migration/handoffOpen.ts`, which restates every constant below
 * and applies the same allowlist again on its own — `handoffOpen.test.ts`
 * opens what this file seals, so the two can't drift apart unnoticed.
 */

import { decryptSecret, isLegacyVault, reencryptLegacyVault } from './crypto';
import { readPayload, StorageSnapshot, STORAGE_PREFIX } from './storage';

export const HANDOFF_PROTOCOL = 'tk-migration-v1' as const;

/**
 * The storage keys that travel. It is an allowlist, not a blocklist: a key this
 * app doesn't know about stays behind. What is deliberately left out, and why:
 *
 * - `meta_encryption_map` is retired; `dropMetaEncryptionMap` removes it here
 *   on every visit.
 * - `touch_id` is a WebAuthn credential scoped to this origin's RP ID and
 *   can't be used anywhere else.
 * - Backend credentials (`pro_auth_token`, `battery_auth_token`,
 *   `multichain_device_certificate`, `multichain_device_tokens`) are
 *   re-issued to the new origin on its own proof, rather than carried to it.
 * - Caches, dev settings and this app's own flags.
 *
 * `user_id`, the analytics id, travels so that someone who moves keeps their
 * history instead of reading as a new user. It is a random id with nothing in
 * it, and the receiving side adopts it only when it has no wallets of its own.
 */
export const HANDOFF_KEYS: readonly string[] = [
    'accounts',
    'active_account_id',
    'global_preferences_config',
    'ui_preferences',
    'fiat',
    'language',
    'lock',
    'multi_send_lists',
    'swap_custom_assets',
    'viewed_multisig_orders',
    'wallet_connect',
    'wallet_connect_meta',
    'multichain_chain_config',
    'multichain_asset_visibility',
    'multichain_favorite_assets',
    'multichain_safe_mode',
    'multichain_dust_filters',
    'multichain_finish_setup_state',
    'multichain_migration_state',
    'multichain_wallet_registration',
    'user_id',
    // The layout that predates `accounts`, which the wallet converts on read.
    'account',
    'password'
];

/** Per-wallet and per-account keys, suffixed with an id. */
export const HANDOFF_KEY_PATTERNS: readonly RegExp[] = [
    /^wallet_config_.+$/,
    /^account_config_.+$/,
    /^connections_.+$/,
    /^favourites_.+$/,
    /^hidden_suggestions_.+$/,
    /^multichain_favorite_recipients_.+$/,
    /^two_fa_wallet_config::.+$/,
    /^wallet_[0-9a-f]{64}$/i,
    /^mnemonic_[0-9a-f]{64}$/i
];

export const isHandoffKey = (key: string): boolean =>
    HANDOFF_KEYS.includes(key) || HANDOFF_KEY_PATTERNS.some(pattern => pattern.test(key));

const DEPRECATED_KEY = /^(account|password|wallet_[0-9a-f]{64}|mnemonic_[0-9a-f]{64})$/i;

/** Storage keys without the wallet's prefix, mapped to the payload they hold. */
export type HandoffEntries = Record<string, unknown>;

export const selectHandoffEntries = (snapshot: StorageSnapshot): HandoffEntries => {
    const prefix = `${STORAGE_PREFIX}_`;
    const entries: HandoffEntries = {};
    const accounts = readPayload<unknown>(snapshot, 'accounts');
    const hasCurrentAccounts = Array.isArray(accounts) && accounts.length > 0;

    for (const [storageKey, raw] of Object.entries(snapshot)) {
        if (!storageKey.startsWith(prefix)) {
            continue;
        }

        const key = storageKey.slice(prefix.length);

        // The consent screen lists current accounts when they exist. Old
        // per-public-key records can remain in storage after conversion or
        // account removal, but are neither listed nor read by the wallet then.
        // For a legacy-only profile, omit an empty modern accounts list so
        // the receiver can run the wallet's legacy conversion.
        if (
            !isHandoffKey(key) ||
            (hasCurrentAccounts && DEPRECATED_KEY.test(key)) ||
            (key === 'accounts' && Array.isArray(accounts) && accounts.length === 0)
        ) {
            continue;
        }

        try {
            const payload = (JSON.parse(raw) as { payload?: unknown }).payload;

            if (payload !== undefined && payload !== null) {
                entries[key] = payload;
            }
        } catch {
            // A value the wallet itself couldn't read is not worth carrying.
        }
    }

    return entries;
};

interface VaultSlot {
    read: () => string;
    write: (vault: string) => void;
}

type MutableAuth = { kind?: string; encryptedSecret?: unknown; encryptedMnemonic?: unknown };

/**
 * Every password vault in the snapshot, wherever the layout it came from keeps
 * it: today's `auth.encryptedSecret`, the `auth.encryptedMnemonic` it replaced,
 * and the per-public-key `mnemonic_<pk>` strings older still.
 */
const vaultSlots = (entries: HandoffEntries): VaultSlot[] => {
    const slots: VaultSlot[] = [];
    const accounts = entries.accounts;

    if (Array.isArray(accounts)) {
        for (const account of accounts as { auth?: MutableAuth }[]) {
            const auth = account?.auth;

            if (auth?.kind !== 'password') {
                continue;
            }

            for (const field of ['encryptedSecret', 'encryptedMnemonic'] as const) {
                if (typeof auth[field] === 'string') {
                    slots.push({
                        read: () => auth[field] as string,
                        write: vault => (auth[field] = vault)
                    });
                }
            }
        }
    }

    for (const key of Object.keys(entries)) {
        if (/^mnemonic_[0-9a-f]{64}$/i.test(key) && typeof entries[key] === 'string') {
            slots.push({
                read: () => entries[key] as string,
                write: vault => (entries[key] = vault)
            });
        }
    }

    return slots;
};

/**
 * Whether the popup asks for the password before sealing. Any vault is reason
 * enough: the password is what the wallet itself asks before it reveals or
 * signs anything, and the lock screen before it shows anything at all, so
 * moving the wallets doesn't get to skip it. Watch-only and hardware accounts
 * have no vault, and neither does a secret kept in a native keychain.
 */
export const hasPasswordVaults = (entries: HandoffEntries): boolean =>
    vaultSlots(entries).length > 0;

export const hasLegacyVaults = (entries: HandoffEntries): boolean =>
    vaultSlots(entries).some(slot => isLegacyVault(slot.read()));

/**
 * A copy of the entries, once the password has opened every vault in them,
 * with each v1 vault replaced by a v2 one under the same password. The
 * originals in this origin's storage are not touched — the handoff is a copy,
 * and the snapshot is all that changes. Throws when the password opens none of
 * them, and equally when it opens only some: one password guards every vault
 * in a profile, so a partial match is not one to send half of. The password
 * itself never leaves this function.
 */
export const unlockVaults = async (
    entries: HandoffEntries,
    password: string
): Promise<HandoffEntries> => {
    const copy = JSON.parse(JSON.stringify(entries)) as HandoffEntries;

    for (const slot of vaultSlots(copy)) {
        if (isLegacyVault(slot.read())) {
            slot.write(await reencryptLegacyVault(slot.read(), password));
        } else {
            await decryptSecret(slot.read(), password);
        }
    }

    return copy;
};

/** What the new origin decrypts: the entries plus everything it checks them against. */
export interface HandoffEnvelope {
    v: 1;
    nonce: string;
    from: string;
    to: string;
    createdAt: number;
    entries: HandoffEntries;
}

export interface HandoffRequest {
    nonce: string;
    publicKey: string;
}

/**
 * The sealed payload, posted to the opener as one string:
 * `v1.<z|r>.<senderKey>.<iv>.<ciphertext>`,
 * base64url throughout. `z` marks a deflated plaintext, which every browser
 * with `CompressionStream` produces — and the same browser profile is on both
 * ends, so one that seals with it can open with it too.
 */
export const sealHandoff = async (input: {
    request: HandoffRequest;
    entries: HandoffEntries;
    from: string;
    to: string;
    now?: number;
}): Promise<string> => {
    if (hasLegacyVaults(input.entries)) {
        throw new Error('A v1 vault can not be handed over as it is');
    }

    const envelope: HandoffEnvelope = {
        v: 1,
        nonce: input.request.nonce,
        from: input.from,
        to: input.to,
        createdAt: input.now ?? Date.now(),
        entries: input.entries
    };

    const recipientKey = await importRecipientKey(input.request.publicKey);
    const sender = await crypto.subtle.generateKey(ECDH, false, ['deriveBits']);
    const senderKey = base64urlEncode(
        new Uint8Array(await crypto.subtle.exportKey('raw', sender.publicKey))
    );

    const Compressor = CompressionStreamCtor;
    const compressed = Compressor !== undefined;
    const header = `v1.${compressed ? 'z' : 'r'}.${senderKey}`;
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const key = await deriveHandoffKey({
        privateKey: sender.privateKey,
        publicKey: recipientKey,
        nonce: input.request.nonce,
        from: input.from,
        to: input.to
    });

    const plaintext = new TextEncoder().encode(JSON.stringify(envelope));
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv, additionalData: new TextEncoder().encode(header) },
        key,
        Compressor ? await deflate(plaintext, Compressor) : plaintext
    );

    return `${header}.${base64urlEncode(iv)}.${base64urlEncode(new Uint8Array(ciphertext))}`;
};

const ECDH: EcKeyGenParams = { name: 'ECDH', namedCurve: 'P-256' };

const NONCE_PATTERN = /^[A-Za-z0-9_-]{22}$/;
const PUBLIC_KEY_PATTERN = /^[A-Za-z0-9_-]{87}$/;

/**
 * Whether a request is shaped like one the new origin sends: a 16-byte nonce
 * and an uncompressed P-256 point, both base64url. Anything else is not a
 * handoff request, however it arrived.
 */
export const isWellFormedRequest = (request: HandoffRequest): boolean =>
    NONCE_PATTERN.test(request.nonce) && PUBLIC_KEY_PATTERN.test(request.publicKey);

/** Rejects a point that isn't on the curve, so no key is derived from one. */
const importRecipientKey = (publicKey: string): Promise<CryptoKey> =>
    crypto.subtle.importKey('raw', base64urlDecode(publicKey), ECDH, false, []);

const deriveHandoffKey = async (input: {
    privateKey: CryptoKey;
    publicKey: CryptoKey;
    nonce: string;
    from: string;
    to: string;
}): Promise<CryptoKey> => {
    const shared = await crypto.subtle.deriveBits(
        { name: 'ECDH', public: input.publicKey },
        input.privateKey,
        256
    );
    const hkdf = await crypto.subtle.importKey('raw', shared, 'HKDF', false, ['deriveKey']);

    return crypto.subtle.deriveKey(
        {
            name: 'HKDF',
            hash: 'SHA-256',
            salt: base64urlDecode(input.nonce),
            info: new TextEncoder().encode(`${HANDOFF_PROTOCOL}|${input.from}|${input.to}`)
        },
        hkdf,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
    );
};

type CompressionStreamConstructor = new (format: 'deflate') => TransformStream<
    Uint8Array,
    Uint8Array
>;

/** Read off `globalThis` because the DOM lib this app compiles against predates it. */
const CompressionStreamCtor = (globalThis as { CompressionStream?: CompressionStreamConstructor })
    .CompressionStream;

const deflate = async (
    bytes: Uint8Array,
    Compressor: CompressionStreamConstructor
): Promise<Uint8Array> =>
    new Uint8Array(
        await new Response(
            (new Blob([bytes]).stream() as ReadableStream<Uint8Array>).pipeThrough(
                new Compressor('deflate')
            )
        ).arrayBuffer()
    );

const base64urlEncode = (bytes: Uint8Array): string => {
    let binary = '';

    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }

    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const base64urlDecode = (value: string): Uint8Array => {
    const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
};
