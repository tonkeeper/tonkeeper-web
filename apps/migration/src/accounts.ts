/**
 * The accounts this origin can still hand back: every wallet whose secret is
 * sitting in this browser behind a password. Watch-only and hardware accounts
 * are not among them — they never held a secret, and re-adding the address or
 * re-pairing the device on the new origin is the whole of their recovery.
 *
 * Both storage layouts are read, because both are still out there: today's
 * `accounts` array, and the per-public-key records that predate it. What they
 * have in common is all this app needs — a name to recognise, an address to
 * tell two rows apart, and an encrypted secret to open.
 *
 * Nothing here is worded: a name the account never had and a count of wallets
 * are returned as data, and the screens put them into the reader's language.
 */

import { toFriendlyAddress, toShortAddress } from './address';
import { readPayload, StorageSnapshot, StorageWrite, STORAGE_PREFIX } from './storage';

/** Mirrors the account-bearing members of `AppKey` in `packages/core/src/Keys.ts`. */
const ACCOUNTS_KEY = 'accounts';
const ACTIVE_ACCOUNT_ID_KEY = 'active_account_id';
const DEPRECATED_ACCOUNT_KEY = 'account';
const DEPRECATED_WALLET_KEY = 'wallet';
const DEPRECATED_MNEMONIC_KEY = 'mnemonic';

/** Mirror `AppKey.CONNECTIONS` and `AppKey.BATTERY_AUTH_TOKEN`, both kept per TON wallet. */
const CONNECTIONS_KEY = 'connections';
const BATTERY_AUTH_TOKEN_KEY = 'battery_auth_token';

/**
 * Per-account encrypted phrases from the layout that predates `accounts`,
 * keyed by public key.
 */
const DEPRECATED_MNEMONIC_PATTERN = new RegExp(
    `^${STORAGE_PREFIX}_${DEPRECATED_MNEMONIC_KEY}_([0-9a-f]{64})$`,
    'i'
);

/** Mirrors `DEFAULT_WALLET_EMOJI` in `packages/core/src/utils/emojis.ts`. */
const DEFAULT_EMOJI = 'custom:wallet';

/** Which storage layout an account came from, which decides how it is removed. */
type AccountLayout = 'accounts' | 'deprecated';

/**
 * What tells two rows apart: one wallet's address, or how many wallets there
 * are.
 */
export type AccountLabel = { address: string } | { walletCount: number };

/**
 * The name the account was given. One that never had a name falls back to the
 * default wallet name — or, in the layout that predates `accounts`, to its
 * position, which the wallet showed as "Account N".
 */
export type AccountName = { custom: string } | { ordinal: number } | { default: true };

export interface RecoverableAccount {
    id: string;
    name: AccountName;
    emoji: string;
    label?: AccountLabel;
    encryptedSecret: string;
    layout: AccountLayout;
}

/** The fields of a stored TON wallet this app looks at. */
interface StoredTonWallet {
    id?: string;
    rawAddress?: string;
    publicKey?: unknown;
}

/** The fields of a stored account this app looks at; everything else is left alone. */
interface StoredAccount {
    type?: string;
    id?: string;
    name?: string;
    emoji?: string;
    auth?: { kind?: string; encryptedSecret?: string };
    /** Standard mnemonic, testnet and secret-key accounts. */
    tonWallets?: StoredTonWallet[];
    /** Watch-only, Keystone and multisig accounts, which hold exactly one. */
    tonWallet?: StoredTonWallet;
    /** MAM accounts, whose wallets hang off the derivations that were added. */
    addedDerivationsIndexes?: number[];
    allAvailableDerivations?: { index?: number; tonWallets?: StoredTonWallet[] }[];
    /** Multichain accounts, whose TON wallets sit among the other chains'. */
    wallets?: (StoredTonWallet & { version?: unknown })[];
}

/** Mirrors `DeprecatedWalletState` in `packages/core/src/entries/wallet.ts`. */
interface DeprecatedWallet {
    name?: string;
    emoji?: string;
    active?: { rawAddress?: string; friendlyAddress?: string };
}

const tonAddresses = (account: StoredAccount): string[] => {
    if (Array.isArray(account.tonWallets)) {
        return account.tonWallets.map(wallet => wallet?.rawAddress).filter(notEmpty);
    }

    if (account.tonWallet) {
        return [account.tonWallet.rawAddress].filter(notEmpty);
    }

    if (Array.isArray(account.allAvailableDerivations)) {
        const added = account.addedDerivationsIndexes ?? [];

        return account.allAvailableDerivations
            .filter(derivation => added.includes(derivation?.index as number))
            .flatMap(derivation => derivation?.tonWallets ?? [])
            .map(wallet => wallet?.rawAddress)
            .filter(notEmpty);
    }

    if (Array.isArray(account.wallets)) {
        return account.wallets
            .filter(wallet => wallet && 'version' in wallet && 'publicKey' in wallet)
            .map(wallet => wallet?.rawAddress)
            .filter(notEmpty);
    }

    return [];
};

const notEmpty = (value: string | undefined): value is string => !!value;

const shortAddress = (rawAddress: string, testnet: boolean): string =>
    toShortAddress(toFriendlyAddress(rawAddress, testnet) ?? rawAddress);

const accountLabel = (account: StoredAccount): AccountLabel | undefined => {
    const addresses = tonAddresses(account);

    if (addresses.length === 1) {
        return { address: shortAddress(addresses[0], account.type === 'testnet') };
    }

    return addresses.length > 1 ? { walletCount: addresses.length } : undefined;
};

const accountName = (name: string | undefined, ordinal?: number): AccountName => {
    if (name) {
        return { custom: name };
    }

    return ordinal === undefined ? { default: true } : { ordinal };
};

/**
 * An account is offered here only when its secret can actually be opened on
 * this origin — a password vault in this browser's own storage. The account
 * types that hold a secret elsewhere (a keychain on a native build) have
 * nothing here to hand back.
 */
const toRecoverable = (account: StoredAccount): RecoverableAccount | undefined => {
    const encryptedSecret = account?.auth?.encryptedSecret;

    if (!account?.id || account.auth?.kind !== 'password' || !encryptedSecret) {
        return undefined;
    }

    return {
        id: account.id,
        name: accountName(account.name),
        emoji: account.emoji || DEFAULT_EMOJI,
        label: accountLabel(account),
        encryptedSecret,
        layout: 'accounts'
    };
};

/**
 * Phrases from the deprecated layout, joined to their wallet record for a name
 * and an address. A phrase whose record has gone missing is still listed: it is
 * a secret in this browser, which is the whole condition for handing it back.
 */
const readDeprecatedAccounts = (snapshot: StorageSnapshot): RecoverableAccount[] =>
    Object.keys(snapshot)
        .map(key => DEPRECATED_MNEMONIC_PATTERN.exec(key))
        .filter(notNull)
        .map((match, index) => {
            const publicKey = match[1];
            const encryptedSecret = readPayload<string>(
                snapshot,
                `${DEPRECATED_MNEMONIC_KEY}_${publicKey}`
            );

            if (typeof encryptedSecret !== 'string') {
                return undefined;
            }

            const wallet = readPayload<DeprecatedWallet>(
                snapshot,
                `${DEPRECATED_WALLET_KEY}_${publicKey}`
            );

            return {
                id: publicKey,
                name: accountName(wallet?.name, index + 1),
                emoji: wallet?.emoji || DEFAULT_EMOJI,
                label: deprecatedLabel(wallet),
                encryptedSecret,
                layout: 'deprecated' as const
            };
        })
        .filter(notUndefined);

/** These records carry the friendly address the wallet showed at the time. */
const deprecatedLabel = (wallet: DeprecatedWallet | undefined): AccountLabel | undefined => {
    const { friendlyAddress, rawAddress } = wallet?.active ?? {};

    if (friendlyAddress) {
        return { address: toShortAddress(friendlyAddress) };
    }

    return rawAddress ? { address: shortAddress(rawAddress, false) } : undefined;
};

const notNull = <T>(value: T | null): value is T => value !== null;
const notUndefined = <T>(value: T | undefined): value is T => value !== undefined;

/**
 * Mirrors the kind labels of `accountDisplay.tsx` in `uikit`, product names
 * left untranslated as they are there. Plain mnemonic accounts carry none.
 */
const KIND_LABELS: Record<string, string> = {
    multichain: 'Multichain',
    mam: 'Multi',
    ledger: 'Ledger',
    keystone: 'Keystone',
    'ton-only': 'Signer',
    'watch-only': 'Watch Only',
    testnet: 'Testnet'
};

/** One row of the list the handoff consent shows. */
export interface HandoffAccount {
    id: string;
    name: AccountName;
    emoji: string;
    label?: AccountLabel;
    kind?: string;
}

/**
 * Every account the handoff sends, of every type — watch-only and hardware
 * accounts travel as much as mnemonic ones do. Read from the same snapshot the
 * payload is sealed from, so the consent screen shows exactly what leaves.
 */
export const readHandoffAccounts = (snapshot: StorageSnapshot): HandoffAccount[] => {
    const accounts = readPayload<StoredAccount[]>(snapshot, ACCOUNTS_KEY);

    if (Array.isArray(accounts) && accounts.length > 0) {
        return accounts
            .filter(account => typeof account?.id === 'string')
            .map(account => ({
                id: account.id as string,
                name: accountName(account.name),
                emoji: account.emoji || DEFAULT_EMOJI,
                label: accountLabel(account),
                kind: KIND_LABELS[account.type ?? '']
            }));
    }

    const state = readPayload<{ publicKeys?: string[] }>(snapshot, DEPRECATED_ACCOUNT_KEY);
    const stray = readDeprecatedAccounts(snapshot).filter(
        account => !state?.publicKeys?.includes(account.id)
    );

    return [
        ...(state?.publicKeys ?? []).map((publicKey, index) => {
            const wallet = readPayload<DeprecatedWallet>(
                snapshot,
                `${DEPRECATED_WALLET_KEY}_${publicKey}`
            );

            return {
                id: publicKey,
                name: accountName(wallet?.name, index + 1),
                emoji: wallet?.emoji || DEFAULT_EMOJI,
                label: deprecatedLabel(wallet)
            };
        }),
        ...stray.map(({ id, name, emoji, label }) => ({ id, name, emoji, label }))
    ];
};

export const readRecoverableAccounts = (snapshot: StorageSnapshot): RecoverableAccount[] => {
    const accounts = readPayload<StoredAccount[]>(snapshot, ACCOUNTS_KEY);

    if (Array.isArray(accounts) && accounts.length > 0) {
        return accounts.map(toRecoverable).filter(notUndefined);
    }

    return readDeprecatedAccounts(snapshot);
};

/**
 * Whether anything here can be recovered by hand instead of handed over — which
 * is what the manual way out offers, and why it stays hidden for a profile made
 * only of watch-only and hardware accounts.
 */
export const hasRecoverableSecret = (snapshot: StorageSnapshot): boolean =>
    readRecoverableAccounts(snapshot).length > 0;

/**
 * Signing out removes the account and, with it, the last copy of its secret —
 * the point of the whole screen, once the phrase has been written down. It is
 * the only wallet data this app ever writes, and it only ever takes away.
 */
export const removeAccountWrites = (
    snapshot: StorageSnapshot,
    account: RecoverableAccount
): StorageWrite[] =>
    account.layout === 'accounts'
        ? removeFromAccounts(snapshot, account.id)
        : removeDeprecatedAccount(snapshot, account.id);

/** Every identifier the wallet keys per-wallet records by: wallet id, address, public key. */
const walletIdentifiers = (accounts: StoredAccount[]): Set<string> =>
    new Set(
        accounts
            .flatMap(account => [
                ...(account?.tonWallets ?? []),
                ...(account?.tonWallet ? [account.tonWallet] : []),
                ...(account?.allAvailableDerivations ?? []).flatMap(
                    derivation => derivation?.tonWallets ?? []
                ),
                ...(account?.wallets ?? [])
            ])
            .flatMap(wallet => [wallet?.id, wallet?.rawAddress, wallet?.publicKey])
            .filter((value): value is string => typeof value === 'string' && value.length > 0)
    );

/**
 * What the wallet kept beside an account's TON wallets — TON Connect sessions
 * and the Battery token — goes with it, so a signed-out wallet leaves no
 * credential behind. Only for identifiers no remaining account shares: two
 * accounts of one seed keep their records under the same public key.
 */
const walletScopedRemovals = (
    snapshot: StorageSnapshot,
    identifiers: string[],
    kept: Set<string>
): StorageWrite[] => {
    const prefix = `${STORAGE_PREFIX}_`;
    const removed = identifiers.filter(identifier => !kept.has(identifier));

    return Object.keys(snapshot)
        .filter(key => key.startsWith(prefix))
        .map(key => key.slice(prefix.length))
        .filter(key =>
            removed.some(
                identifier =>
                    key === `${BATTERY_AUTH_TOKEN_KEY}_${identifier}` ||
                    key.startsWith(`${CONNECTIONS_KEY}_${identifier}_`)
            )
        )
        .map(key => ({ key, remove: true as const }));
};

const removeFromAccounts = (snapshot: StorageSnapshot, id: string): StorageWrite[] => {
    const stored = readPayload<StoredAccount[]>(snapshot, ACCOUNTS_KEY) ?? [];
    const remaining = stored.filter(account => account?.id !== id);

    const writes: StorageWrite[] = [
        { key: ACCOUNTS_KEY, payload: remaining },
        ...walletScopedRemovals(
            snapshot,
            [...walletIdentifiers(stored.filter(account => account?.id === id))],
            walletIdentifiers(remaining)
        )
    ];

    if (readPayload<string>(snapshot, ACTIVE_ACCOUNT_ID_KEY) === id) {
        writes.push({ key: ACTIVE_ACCOUNT_ID_KEY, payload: remaining[0]?.id ?? null });
    }

    return writes;
};

const removeDeprecatedAccount = (snapshot: StorageSnapshot, publicKey: string): StorageWrite[] => {
    const state = readPayload<{ publicKeys?: string[]; activePublicKey?: string }>(
        snapshot,
        DEPRECATED_ACCOUNT_KEY
    );
    const remaining = (state?.publicKeys ?? []).filter(key => key !== publicKey);

    const wallet = readPayload<DeprecatedWallet>(snapshot, `${DEPRECATED_WALLET_KEY}_${publicKey}`);

    const writes: StorageWrite[] = [
        { key: `${DEPRECATED_MNEMONIC_KEY}_${publicKey}`, remove: true },
        { key: `${DEPRECATED_WALLET_KEY}_${publicKey}`, remove: true },
        ...walletScopedRemovals(
            snapshot,
            [publicKey, wallet?.active?.rawAddress].filter(notEmpty),
            new Set()
        )
    ];

    if (state) {
        writes.push({
            key: DEPRECATED_ACCOUNT_KEY,
            payload: {
                publicKeys: remaining,
                activePublicKey:
                    state.activePublicKey === publicKey ? remaining[0] : state.activePublicKey
            }
        });
    }

    return writes;
};
