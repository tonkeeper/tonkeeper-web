import { Account } from '@tonkeeper/core/dist/entries/account';
import { AuthPassword } from '@tonkeeper/core/dist/entries/password';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { decrypt } from '@tonkeeper/core/dist/service/cryptoService';
import { AccountsStorage } from '@tonkeeper/core/dist/service/accountsStorage';
import {
    getGlobalPreferences,
    GlobalPreferences,
    setGlobalPreferences
} from '@tonkeeper/core/dist/service/globalPreferencesService';
import { IStorage, MemoryStorage } from '@tonkeeper/core/dist/Storage';

import { HandoffEntries } from './handoffOpen';

/**
 * Keys that only exist to be converted into `accounts`. The conversion runs
 * here, over the payload, so they never land in this origin's storage.
 */
const DEPRECATED_LAYOUT_KEY = /^(account|password|wallet_[0-9a-f]{64}|mnemonic_[0-9a-f]{64})$/i;

/**
 * The account types the wallet knows how to bind. An account is persisted as
 * plain JSON and re-bound to its class by `type` on every read, so one with any
 * other type — or one whose wallets can't be read — would break the wallet on
 * every boot after being written, not just here.
 */
const ACCOUNT_TYPES: readonly string[] = [
    'mnemonic',
    'testnet',
    'ledger',
    'keystone',
    'ton-only',
    'watch-only',
    'mam',
    'ton-multisig',
    'sk',
    'multichain'
];

const assertStoredAccounts = (value: unknown): void => {
    if (value === undefined) {
        return;
    }

    const valid =
        Array.isArray(value) &&
        value.every(
            account =>
                typeof account === 'object' &&
                account !== null &&
                typeof (account as { id?: unknown }).id === 'string' &&
                ACCOUNT_TYPES.includes((account as { type?: unknown }).type as string)
        );

    if (!valid) {
        throw new Error('Handoff payload holds an account the wallet cannot read');
    }
};

const assertReadableAccounts = (accounts: Account[]): void => {
    for (const account of accounts) {
        if (!Array.isArray(account.allTonWallets)) {
            throw new Error('Handoff payload holds an account the wallet cannot read');
        }
    }
};

interface WalletRegistration {
    registered?: boolean;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The old origin's analytics id, when it is one; it goes into every event once adopted. */
const readLegacyUserId = (value: unknown): string | undefined =>
    typeof value === 'string' && UUID_PATTERN.test(value) ? value : undefined;

/**
 * What confirming would do, worked out before anything is written. Accounts
 * already on this origin are never replaced: an incoming one with the same id
 * is left out, and so is any other key this origin already holds.
 */
export interface HandoffImportPlan {
    /** Incoming accounts this origin doesn't have yet, in their stored order. */
    accounts: Account[];
    /** How many incoming accounts are already here and will be left as they are. */
    alreadyHere: number;
    /** The rest of the payload, restricted to keys absent here. */
    writes: Record<string, unknown>;
    /**
     * The avatar colour each incoming account had, by account id. Colours live
     * in the preferences record rather than on the account, and that record
     * stays out of `writes` whenever this origin has one of its own, so they
     * are carried separately and merged in.
     */
    walletColors: Record<string, string>;
    /** Set only when this origin has no active account of its own to keep. */
    activeAccountId: string | null;
    /**
     * Set when both sides hold password vaults. One password guards every
     * vault on an origin, so the incoming ones are only added once a password
     * opens both a local and an incoming vault.
     */
    passwordCheck?: { local: string; incoming: string };
    /** Detect a password change or a newly added password wallet while awaiting approval. */
    localPasswordVaults: string;
    /** The old origin's analytics id, reported with the import. */
    legacyUserId?: string;
    /**
     * Set when this origin has no wallets of its own: it then takes over the
     * old origin's analytics id, so the person's history carries on rather
     * than starting again as a new user. Unlike every other key it replaces the
     * id here, which the migration screens' own events have already created.
     */
    adoptUserId?: string;
}

const isPasswordAccount = (account: Account): account is Account & { auth: AuthPassword } =>
    'auth' in account && (account.auth as { kind?: string }).kind === 'password';

const passwordVaults = (accounts: Account[]): string =>
    JSON.stringify(
        accounts
            .filter(isPasswordAccount)
            .map(account => [account.id, account.auth.encryptedSecret])
    );

export const planHandoffImport = async (
    entries: HandoffEntries,
    storage: IStorage
): Promise<HandoffImportPlan> => {
    // The wallet's own reader does the parsing — class binding, the
    // pre-`accounts` layout, the `encryptedMnemonic` rename — over a scratch
    // copy of the payload, so this origin reads the payload exactly the way it
    // reads its own storage.
    assertStoredAccounts(entries[AppKey.ACCOUNTS]);

    const scratch = new MemoryStorage();
    await scratch.setBatch(JSON.parse(JSON.stringify(entries)) as HandoffEntries);
    const scratchAccounts = new AccountsStorage(scratch);
    const incoming = await scratchAccounts.getAccounts();

    if (incoming.length === 0) {
        throw new Error('Handoff payload holds no accounts');
    }

    assertReadableAccounts(incoming);

    const local = await new AccountsStorage(storage).getAccounts();
    const localIds = new Set(local.map(account => account.id));
    const accounts = incoming.filter(account => !localIds.has(account.id));

    const writes: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(entries)) {
        if (
            key === AppKey.ACCOUNTS ||
            key === AppKey.ACTIVE_ACCOUNT_ID ||
            key === AppKey.USER_ID ||
            DEPRECATED_LAYOUT_KEY.test(key) ||
            (await storage.get(key)) !== null
        ) {
            continue;
        }

        writes[key] = key === AppKey.MULTICHAIN_WALLET_REGISTRATION ? unregistered(value) : value;
    }

    const incomingActive = await readIncomingActiveAccountId(scratch, scratchAccounts);
    const localActive = await storage.get<string>(AppKey.ACTIVE_ACCOUNT_ID);
    const incomingColors = readIncomingWalletColors(entries);

    const localVault = local.find(isPasswordAccount)?.auth.encryptedSecret;
    const incomingVault = accounts.find(isPasswordAccount)?.auth.encryptedSecret;

    const legacyUserId = readLegacyUserId(entries[AppKey.USER_ID]);

    return {
        legacyUserId,
        adoptUserId: local.length === 0 ? legacyUserId : undefined,
        accounts,
        alreadyHere: incoming.length - accounts.length,
        writes,
        walletColors: Object.fromEntries(
            accounts
                .filter(account => incomingColors[account.id] !== undefined)
                .map(account => [account.id, incomingColors[account.id]])
        ),
        activeAccountId:
            localActive && localIds.has(localActive)
                ? null
                : accounts.find(account => account.id === incomingActive)?.id ??
                  accounts[0]?.id ??
                  null,
        passwordCheck:
            localVault && incomingVault
                ? { local: localVault, incoming: incomingVault }
                : undefined,
        localPasswordVaults: passwordVaults(local)
    };
};

/**
 * A wallet's backend registration belongs to the device that made it, and the
 * device certificate stays behind on the old origin. Marking every record
 * unregistered makes this origin's own device register the wallet again the
 * first time it is used, from the accounts list the record keeps.
 */
const unregistered = (value: unknown): unknown =>
    typeof value === 'object' && value !== null
        ? Object.fromEntries(
              Object.entries(value as Record<string, WalletRegistration>).map(([id, record]) => [
                  id,
                  { ...record, registered: false }
              ])
          )
        : value;

const readIncomingWalletColors = (entries: HandoffEntries): Record<string, string> => {
    const preferences = entries[AppKey.GLOBAL_PREFERENCES_CONFIG] as
        | Partial<GlobalPreferences>
        | undefined;
    const colors: unknown = preferences?.walletColors;

    if (typeof colors !== 'object' || colors === null) {
        return {};
    }

    return Object.fromEntries(
        Object.entries(colors).filter(
            (entry): entry is [string, string] => typeof entry[1] === 'string'
        )
    );
};

/**
 * Gives each added account the colour it had, unless this origin already
 * picked one for that id. Only the colours: folders and sidebar order describe
 * the old origin's own list and don't carry over into this one's.
 */
const mergeWalletColors = async (
    storage: IStorage,
    colors: Record<string, string>,
    added: Account[]
): Promise<void> => {
    const { walletColors } = await getGlobalPreferences(storage);
    const missing = added.filter(
        account => colors[account.id] !== undefined && walletColors[account.id] === undefined
    );

    if (missing.length > 0) {
        await setGlobalPreferences(storage, {
            walletColors: {
                ...walletColors,
                ...Object.fromEntries(missing.map(account => [account.id, colors[account.id]]))
            }
        });
    }
};

const readIncomingActiveAccountId = async (
    scratch: IStorage,
    scratchAccounts: AccountsStorage
): Promise<string | null> => {
    const stored = await scratch.get<string>(AppKey.ACTIVE_ACCOUNT_ID);

    if (stored) {
        return stored;
    }

    try {
        return await scratchAccounts.getActiveAccountId();
    } catch {
        return null;
    }
};

/** Whether one password opens a vault on each side, as one origin's password must. */
export const isSharedPassword = async (
    check: NonNullable<HandoffImportPlan['passwordCheck']>,
    password: string
): Promise<boolean> => {
    try {
        await decrypt(check.local, password);
        await decrypt(check.incoming, password);
        return true;
    } catch {
        return false;
    }
};

/**
 * Writes the plan. Everything but the accounts goes first and the accounts
 * list last, in one write, so an import cut off part-way leaves this origin
 * without the new accounts — which reads as "not imported", and is retried as
 * one.
 */
export const applyHandoffImport = async (
    plan: HandoffImportPlan,
    storage: IStorage
): Promise<void> => {
    const accountsStorage = new AccountsStorage(storage);
    const currentAccounts = await accountsStorage.getAccounts();
    const currentIds = new Set(currentAccounts.map(account => account.id));

    // Another tab may have completed this import while the plan was open.
    // With no new accounts to add, there is no password compatibility to check
    // and no reason to write the rest of a now-obsolete plan.
    if (plan.accounts.every(account => currentIds.has(account.id))) {
        return;
    }

    if (passwordVaults(currentAccounts) !== plan.localPasswordVaults) {
        throw new Error('Local password wallets changed during the handoff');
    }

    // Recheck immediately before writing: a setting absent when the plan was
    // made may have been created in another tab while approval was pending.
    const writes: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(plan.writes)) {
        if ((await storage.get(key)) === null) {
            writes[key] = value;
        }
    }

    if (Object.keys(writes).length > 0) {
        await storage.setBatch(writes);
    }

    // A second check covers changes that happened while other values were
    // written. Account ids are read again so additions by other tabs survive.
    const local = await accountsStorage.getAccounts();
    const localIds = new Set(local.map(account => account.id));
    const added = plan.accounts.filter(account => !localIds.has(account.id));

    if (added.length === 0) {
        return;
    }

    if (passwordVaults(local) !== plan.localPasswordVaults) {
        throw new Error('Local password wallets changed during the handoff');
    }

    await mergeWalletColors(storage, plan.walletColors, added);
    await accountsStorage.setAccounts([...local, ...added]);

    if (plan.activeAccountId && added.some(account => account.id === plan.activeAccountId)) {
        await accountsStorage.setActiveAccountId(plan.activeAccountId);
    }
};

/**
 * Run after the import is reported, so the import event still carries this
 * origin's own id next to the old one and joins the events sent before it.
 */
export const adoptLegacyUserId = async (plan: HandoffImportPlan, storage: IStorage) => {
    if (plan.adoptUserId) {
        await storage.set(AppKey.USER_ID, plan.adoptUserId);
    }
};
