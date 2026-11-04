import { AppKey } from '../Keys';
import { IStorage } from '../Storage';

/**
 * Safe mode hides scam-ish assets: anything the backend hasn't verified
 * (`verification` of `none` or `blacklist`) disappears from the wallet's
 * asset list, and asset requests carry `verified_only` so the backend
 * filters and totals accordingly. Mirrors Android's TK-2493 semantics:
 *
 * - no stored choice → follow the server's `safe_mode_enabled` config flag;
 * - switching the toggle off disables safe mode for 24 hours only, after
 *   which it re-enables itself;
 * - while temporarily disabled the user can commit to "off permanently".
 */
export type SafeModeStoredState =
    | { type: 'enabled' }
    | { type: 'disabled'; disabledAtMs: number }
    | { type: 'disabled-permanently' };

/** Keyed by account id so wallets toggle independently, as on Android. */
type StoredSafeMode = Record<string, SafeModeStoredState>;

export const SAFE_MODE_AUTO_REENABLE_MS = 24 * 60 * 60 * 1000;

export interface SafeModeState {
    enabled: boolean;
    /**
     * The 24-hour off window is running: safe mode is off but will come
     * back by itself. This is the state that offers "turn off permanently".
     */
    temporarilyDisabled: boolean;
}

export function resolveSafeModeState(
    stored: SafeModeStoredState | undefined,
    serverDefaultEnabled: boolean,
    nowMs: number
): SafeModeState {
    if (!stored) {
        return { enabled: serverDefaultEnabled, temporarilyDisabled: false };
    }
    switch (stored.type) {
        case 'enabled':
            return { enabled: true, temporarilyDisabled: false };
        case 'disabled-permanently':
            return { enabled: false, temporarilyDisabled: false };
        case 'disabled': {
            const stillDisabled = nowMs < stored.disabledAtMs + SAFE_MODE_AUTO_REENABLE_MS;
            return { enabled: !stillDisabled, temporarilyDisabled: stillDisabled };
        }
    }
}

export async function getSafeModeStoredState(
    storage: IStorage,
    accountId: string
): Promise<SafeModeStoredState | undefined> {
    const map = await storage.get<StoredSafeMode>(AppKey.MULTICHAIN_SAFE_MODE);
    return map?.[accountId];
}

export async function setSafeModeStoredState(
    storage: IStorage,
    accountId: string,
    state: SafeModeStoredState
): Promise<void> {
    const map = (await storage.get<StoredSafeMode>(AppKey.MULTICHAIN_SAFE_MODE)) ?? {};
    await storage.set<StoredSafeMode>(AppKey.MULTICHAIN_SAFE_MODE, {
        ...map,
        [accountId]: state
    });
}
