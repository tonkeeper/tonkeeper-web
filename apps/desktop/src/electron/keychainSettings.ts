import { createHash } from 'crypto';
import { systemPreferences } from 'electron';
import Store from 'electron-store';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { KeychainScope, KeychainSecurity } from '@tonkeeper/core/dist/AppSdk';
import { AUTHORIZATION_REQUIRED, passwordAttemptsLocked } from '../libs/keychainErrors';
import { electronStore } from './storageService';

interface KeychainSettingsState {
    passwordHash?: string;
    biometryEnabled?: boolean;
}

const STATE_KEY = 'state';

const AUTHORIZATION_TTL_MS = 30_000;
const FREE_PASSWORD_ATTEMPTS = 5;
const MAX_PASSWORD_DELAY_MS = 60_000;

const store = new Store({ name: 'keychain-settings' });

const hashPassword = (password: string) => createHash('sha256').update(password).digest('hex');

let legacyMoved = false;

const moveLegacySettings = () => {
    if (legacyMoved) return;
    legacyMoved = true;

    const legacy = electronStore.get(AppKey.KEYCHAIN_SETTINGS, null);
    if (legacy === null) return;
    if (!store.has(STATE_KEY)) {
        store.set(STATE_KEY, legacy);
    }
    electronStore.delete(AppKey.KEYCHAIN_SETTINGS);
};

const load = (): KeychainSettingsState => {
    moveLegacySettings();
    return (store.get(STATE_KEY, null) as KeychainSettingsState | null) ?? {};
};

const update = (state: KeychainSettingsState) => {
    store.set(STATE_KEY, { ...load(), ...state });
};

const isProtected = () => {
    const state = load();
    return !!state.passwordHash || !!state.biometryEnabled;
};

const SETTINGS_SCOPE: KeychainScope = { operation: 'settings' };

/** The scope arrives from the renderer, so its shape is checked here. */
const scopeId = (scope: unknown): string => {
    if (typeof scope === 'object' && scope !== null) {
        const { operation, key } = scope as { operation?: unknown; key?: unknown };
        if (
            (operation === 'get' || operation === 'set' || operation === 'remove') &&
            typeof key === 'string' &&
            key.length > 0
        ) {
            return `${operation}:${key}`;
        }
        if (operation === 'clear') {
            return 'clear';
        }
    }
    return 'settings';
};

/**
 * Each successful password or biometry check in this process allows exactly
 * one protected operation shortly after it: the one the check was made for,
 * on the same keychain entry. The renderer's own prompts stay the only UI
 * while the decision is made here.
 */
let authorizations: { scope: string; expiresAt: number }[] = [];

const grantAuthorization = (scope: unknown) => {
    authorizations.push({ scope: scopeId(scope), expiresAt: Date.now() + AUTHORIZATION_TTL_MS });
};

const takeAuthorization = (scope: KeychainScope) => {
    const now = Date.now();
    authorizations = authorizations.filter(({ expiresAt }) => expiresAt > now);
    const index = authorizations.findIndex(grant => grant.scope === scopeId(scope));
    if (index === -1) {
        return false;
    }
    authorizations.splice(index, 1);
    return true;
};

let failedPasswordAttempts = 0;
let nextPasswordAttemptAt = 0;

export const keychainSettings = {
    getSecurity: (): KeychainSecurity => {
        const state = load();
        return { biometry: state.biometryEnabled, password: !!state.passwordHash };
    },

    checkPassword: (password: string, scope?: unknown): boolean => {
        const { passwordHash } = load();
        if (!passwordHash) {
            throw new Error('Password is not set');
        }
        if (Date.now() < nextPasswordAttemptAt) {
            throw new Error(passwordAttemptsLocked(nextPasswordAttemptAt - Date.now()));
        }

        const isValid = typeof password === 'string' && hashPassword(password) === passwordHash;
        if (isValid) {
            failedPasswordAttempts = 0;
            nextPasswordAttemptAt = 0;
            grantAuthorization(scope);
        } else {
            failedPasswordAttempts += 1;
            if (failedPasswordAttempts >= FREE_PASSWORD_ATTEMPTS) {
                const delay = Math.min(
                    1000 * 2 ** (failedPasswordAttempts - FREE_PASSWORD_ATTEMPTS),
                    MAX_PASSWORD_DELAY_MS
                );
                nextPasswordAttemptAt = Date.now() + delay;
            }
        }
        return isValid;
    },

    promptBiometry: async (reason: string, scope?: unknown) => {
        await systemPreferences.promptTouchID(String(reason));
        grantAuthorization(scope);
    },

    authorize: (scope: KeychainScope) => {
        if (isProtected() && !takeAuthorization(scope)) {
            throw new Error(AUTHORIZATION_REQUIRED);
        }
    },

    setPassword: (password: string) => {
        if (typeof password !== 'string' || !password) {
            throw new Error('Invalid password');
        }
        keychainSettings.authorize(SETTINGS_SCOPE);
        update({ passwordHash: hashPassword(password) });
    },

    setBiometry: (enabled: boolean) => {
        keychainSettings.authorize(SETTINGS_SCOPE);
        update({ biometryEnabled: enabled === true });
    },

    /**
     * Once no secrets are stored there is nothing left to protect, so the
     * settings can be cleared without a check, e.g. right after signing out.
     */
    reset: async (hasStoredSecrets: () => Promise<boolean>) => {
        if (isProtected() && !takeAuthorization(SETTINGS_SCOPE) && (await hasStoredSecrets())) {
            throw new Error(AUTHORIZATION_REQUIRED);
        }
        store.set(STATE_KEY, {});
        authorizations = [];
    }
};
