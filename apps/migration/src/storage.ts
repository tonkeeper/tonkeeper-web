/**
 * Reads of the wallet's own `localStorage`, which stayed behind on this origin
 * when the app moved. The only value this app owns is the handoff flag; the
 * only wallet data it ever writes is a removal: of `meta_encryption_map` on
 * every visit, and of an account someone signs out after writing its phrase
 * down (see `accounts.ts`).
 *
 * The prefix and key names are restated rather than imported. This app builds
 * without `@tonkeeper/core` on purpose, so that no wallet code can reach the
 * bundle served on this origin; `seedLegacyStorage.mjs` mirrors the same
 * constants for the same reason.
 */

/** Mirrors `BrowserStorage.prefix` in `apps/web/src/libs/storage.ts`. */
export const STORAGE_PREFIX = 'tonkeeper';

/** Mirrors the account-bearing members of `AppKey` in `packages/core/src/Keys.ts`. */
const ACCOUNTS_KEY = 'accounts';
const DEPRECATED_ACCOUNT_KEY = 'account';
const DEPRECATED_WALLET_KEY = 'wallet';

/**
 * Per-wallet records from the storage layout that predates `accounts`, keyed by
 * public key. The suffix is matched so that today's `wallet_config` and
 * `wallet_connect` — which hold no wallet of their own — don't read as one.
 */
const DEPRECATED_WALLET_PATTERN = new RegExp(
    `^${STORAGE_PREFIX}_(wallet|mnemonic)_[0-9a-f]{64}$`,
    'i'
);

/** Mirrors `AppKey.LANGUAGE`. */
const LANGUAGE_KEY = 'language';

/** Mirrors `AppKey.META_ENCRYPTION_MAP`. */
const META_ENCRYPTION_MAP_KEY = 'meta_encryption_map';

/** Set on this origin once a handoff payload has been built and handed over. */
const MIGRATED_AT_KEY = 'migrated_at';

/**
 * The origin's storage read once, as a plain map. Taking a snapshot keeps the
 * rules below free of the DOM, so what counts as a wallet can be pinned by
 * tests rather than by opening a browser.
 */
export type StorageSnapshot = Record<string, string>;

/**
 * Storage access throws outright when the browser blocks site data, which is a
 * profile with nothing to hand over rather than a reason to break the page.
 */
export const readStorageSnapshot = (): StorageSnapshot => {
    try {
        return { ...localStorage };
    } catch {
        return {};
    }
};

export const readPayload = <T>(snapshot: StorageSnapshot, key: string): T | undefined => {
    const raw = snapshot[`${STORAGE_PREFIX}_${key}`];

    if (!raw) {
        return undefined;
    }

    try {
        return (JSON.parse(raw) as { payload: T }).payload ?? undefined;
    } catch {
        return undefined;
    }
};

/**
 * Whether this profile holds anything worth moving. Every account type counts —
 * a watch-only account, a testnet one and a paired Ledger are as much a reason
 * to offer the handoff as a mnemonic is. Preferences alone are not: theme,
 * language and the like are written by merely opening the site, and a visitor
 * who never made a wallet has nothing to move.
 */
export const hasWalletData = (snapshot: StorageSnapshot): boolean => {
    const accounts = readPayload<unknown[]>(snapshot, ACCOUNTS_KEY);

    if (Array.isArray(accounts) && accounts.length > 0) {
        return true;
    }

    const deprecated = readPayload<{ publicKeys?: string[] }>(snapshot, DEPRECATED_ACCOUNT_KEY);

    if (deprecated?.publicKeys?.length) {
        return true;
    }

    return Object.keys(snapshot).some(key => DEPRECATED_WALLET_PATTERN.test(key));
};

/**
 * The language picked in the wallet's settings — the `Language` enum's number —
 * read the way `useUserLanguage` reads it: today's key first, then the active
 * wallet's record from the layout that predates it.
 */
export const readLanguage = (snapshot: StorageSnapshot): number | undefined => {
    let language = readPayload<unknown>(snapshot, LANGUAGE_KEY);

    if (language === undefined) {
        const state = readPayload<{ activePublicKey?: string }>(snapshot, DEPRECATED_ACCOUNT_KEY);

        if (state?.activePublicKey) {
            language = readPayload<{ lang?: unknown }>(
                snapshot,
                `${DEPRECATED_WALLET_KEY}_${state.activePublicKey}`
            )?.lang;
        }
    }

    return Number.isInteger(language) ? (language as number) : undefined;
};

/** Whether a handoff from this profile has already completed. */
export const hasMigrated = (snapshot: StorageSnapshot): boolean =>
    readPayload<string>(snapshot, MIGRATED_AT_KEY) !== undefined;

/**
 * Written as a payload leaves, so the next plain visit here redirects instead
 * of offering an old snapshot again. It only changes that default: a request
 * from the new origin is still answered, which keeps a failed import
 * retryable.
 */
export const markMigrated = (now = Date.now()): void => {
    applyWrites([{ key: MIGRATED_AT_KEY, payload: now }]);
};

/**
 * A single change to this origin's storage: a value written in the wallet's own
 * `{ payload }` envelope, or a key taken away.
 */
export type StorageWrite = { key: string; payload: unknown } | { key: string; remove: true };

export const applyWrites = (writes: StorageWrite[]): void => {
    for (const write of writes) {
        const key = `${STORAGE_PREFIX}_${write.key}`;

        if ('remove' in write) {
            localStorage.removeItem(key);
        } else {
            localStorage.setItem(key, JSON.stringify({ payload: write.payload }));
        }
    }
};

/**
 * The key is retired, and the wallet code that removes it doesn't run on this
 * origin, so this app removes it itself.
 */
export const dropMetaEncryptionMap = (): void => {
    try {
        applyWrites([{ key: META_ENCRYPTION_MAP_KEY, remove: true }]);
    } catch {
        // Blocked site data holds no map to remove.
    }
};
