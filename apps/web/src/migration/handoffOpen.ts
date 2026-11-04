import { NEW_ORIGIN, OLD_ORIGIN } from './config';
import { PendingHandoff } from './handoffRequest';

/**
 * Opens a payload the old origin sealed to this tab. By the time one gets here
 * `handoffChannel.ts` has already checked, on the browser's word, that the old
 * origin's popup sent it. The sending side is
 * `apps/migration/src/handoff.ts`; the constants and the allowlist here are
 * restated rather than shared because that app builds without any wallet code,
 * and restating the allowlist is also the point — this side filters on its own,
 * whatever the payload contains. `handoffOpen.test.ts` seals with the real
 * sender and opens here.
 *
 * A payload is trusted only when it decrypts under the key this tab generated
 * — with the nonce it sent as the HKDF salt and both pinned origins as the
 * info — and its envelope then echoes that nonce and names that pair.
 */

const HANDOFF_PROTOCOL = 'tk-migration-v1';

/**
 * How long a request stays answerable. Approving on the old origin, and the
 * password prompt there, fit well inside it; a payload that
 * arrives later belongs to a round trip nobody is waiting on.
 */
export const PENDING_HANDOFF_TTL_MS = 15 * 60 * 1000;

/** Bounds the work a posted string can ask of this side before it is trusted. */
const MAX_PAYLOAD_LENGTH = 16 * 1024 * 1024;

/** Mirrors `HANDOFF_KEYS` in the sender; see there for what stays behind and why. */
const HANDOFF_KEYS: readonly string[] = [
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
    'account',
    'password'
];

/** Mirrors `HANDOFF_KEY_PATTERNS` in the sender. */
const HANDOFF_KEY_PATTERNS: readonly RegExp[] = [
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

export type HandoffEntries = Record<string, unknown>;

export type OpenedHandoff =
    | { ok: true; entries: HandoffEntries }
    | {
          ok: false;
          reason: 'no-request' | 'expired' | 'malformed' | 'decrypt' | 'nonce' | 'legacy-vault';
      };

interface HandoffEnvelope {
    v?: unknown;
    nonce?: unknown;
    from?: unknown;
    to?: unknown;
    entries?: unknown;
}

const ECDH: EcKeyImportParams = { name: 'ECDH', namedCurve: 'P-256' };

const PAYLOAD_PATTERN = /^v1\.([zr])\.([A-Za-z0-9_-]{87})\.([A-Za-z0-9_-]{16})\.([A-Za-z0-9_-]+)$/;

export const openHandoff = async (input: {
    payload: string;
    pending: PendingHandoff | undefined;
    now?: number;
}): Promise<OpenedHandoff> => {
    const { payload, pending } = input;

    if (!pending) {
        return { ok: false, reason: 'no-request' };
    }

    if (
        !Number.isFinite(pending.createdAt) ||
        (input.now ?? Date.now()) - pending.createdAt > PENDING_HANDOFF_TTL_MS
    ) {
        return { ok: false, reason: 'expired' };
    }

    const match = payload.length <= MAX_PAYLOAD_LENGTH ? PAYLOAD_PATTERN.exec(payload) : null;

    if (!match) {
        return { ok: false, reason: 'malformed' };
    }

    const [, compression, senderKey, iv, ciphertext] = match;
    const header = `v1.${compression}.${senderKey}`;

    let plaintext: Uint8Array;

    try {
        const key = await deriveHandoffKey({
            privateKey: pending.privateKey,
            publicKey: await crypto.subtle.importKey(
                'raw',
                base64urlDecode(senderKey),
                ECDH,
                false,
                []
            ),
            nonce: pending.nonce
        });

        const opened = new Uint8Array(
            await crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: base64urlDecode(iv),
                    additionalData: new TextEncoder().encode(header)
                },
                key,
                base64urlDecode(ciphertext)
            )
        );

        plaintext = compression === 'z' ? await inflate(opened) : opened;
    } catch {
        return { ok: false, reason: 'decrypt' };
    }

    let envelope: HandoffEnvelope;

    try {
        envelope = JSON.parse(new TextDecoder().decode(plaintext)) as HandoffEnvelope;
    } catch {
        return { ok: false, reason: 'malformed' };
    }

    if (
        envelope?.v !== 1 ||
        envelope.nonce !== pending.nonce ||
        envelope.from !== OLD_ORIGIN ||
        envelope.to !== NEW_ORIGIN
    ) {
        return { ok: false, reason: 'nonce' };
    }

    if (!isPlainObject(envelope.entries)) {
        return { ok: false, reason: 'malformed' };
    }

    const entries = filterEntries(envelope.entries);

    // The sender re-encrypts every v1 vault before sealing. One arriving here
    // anyway came from a sender that skipped that step, and nothing it carries
    // is imported.
    if (hasLegacyVault(entries)) {
        return { ok: false, reason: 'legacy-vault' };
    }

    return { ok: true, entries };
};

const filterEntries = (entries: Record<string, unknown>): HandoffEntries =>
    Object.fromEntries(
        Object.entries(entries).filter(
            ([key, value]) => isHandoffKey(key) && value !== null && value !== undefined
        )
    );

const isLegacyVault = (value: unknown): boolean =>
    typeof value !== 'string' || !value.startsWith('v2:');

const hasLegacyVault = (entries: HandoffEntries): boolean => {
    const accounts = Array.isArray(entries.accounts) ? entries.accounts : [];

    const accountVaults = accounts.flatMap(account => {
        const auth = (account as { auth?: Record<string, unknown> } | null)?.auth;

        if (auth?.kind !== 'password') {
            return [];
        }

        return ['encryptedSecret', 'encryptedMnemonic']
            .filter(field => field in auth)
            .map(field => auth[field]);
    });

    const deprecatedVaults = Object.keys(entries)
        .filter(key => /^mnemonic_[0-9a-f]{64}$/i.test(key))
        .map(key => entries[key]);

    return [...accountVaults, ...deprecatedVaults].some(isLegacyVault);
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const deriveHandoffKey = async (input: {
    privateKey: CryptoKey;
    publicKey: CryptoKey;
    nonce: string;
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
            info: new TextEncoder().encode(`${HANDOFF_PROTOCOL}|${OLD_ORIGIN}|${NEW_ORIGIN}`)
        },
        hkdf,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
    );
};

/**
 * Anyone who saw the request can seal a payload to it, so what inflates is
 * bounded before it is trusted: a few kilobytes of deflate can otherwise expand
 * into gigabytes.
 */
const MAX_INFLATED_BYTES = 16 * 1024 * 1024;

/** Read off `globalThis` because the DOM lib this app compiles against predates it. */
const DecompressionStreamCtor = (
    globalThis as {
        DecompressionStream?: new (format: 'deflate') => TransformStream<Uint8Array, Uint8Array>;
    }
).DecompressionStream;

const inflate = async (bytes: Uint8Array): Promise<Uint8Array> => {
    if (!DecompressionStreamCtor) {
        throw new Error('This browser cannot inflate a handoff payload');
    }

    const reader = (new Blob([bytes]).stream() as ReadableStream<Uint8Array>)
        .pipeThrough(new DecompressionStreamCtor('deflate'))
        .getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;

    for (;;) {
        const { done, value } = await reader.read();

        if (done) {
            break;
        }

        total += value.length;

        if (total > MAX_INFLATED_BYTES) {
            await reader.cancel();
            throw new Error('Handoff payload inflates past its limit');
        }

        chunks.push(value);
    }

    const out = new Uint8Array(total);
    let offset = 0;

    for (const chunk of chunks) {
        out.set(chunk, offset);
        offset += chunk.length;
    }

    return out;
};

const base64urlDecode = (value: string): Uint8Array => {
    const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
};
