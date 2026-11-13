import { AppKey } from '../../Keys';
import { IStorage } from '../../Storage';
import { DeviceAuthService } from './deviceAuthService';
import {
    MultichainRegisterAccount,
    MultichainWalletAuthCredentials,
    mintWalletAuthToken,
    registerMultichainWallet
} from './walletAuthService';

/**
 * Request-side auth for the multichain REST API, mirroring the native
 * middleware stack (`MultichainMiddlewares.swift`):
 *
 * - every request carries the device JWT (`Authorization: Bearer …`);
 * - wallet-scoped requests additionally carry `X-Wallet-ID` +
 *   `X-Wallet-Authorization` when the account holds a wallet auth key —
 *   both headers or neither, the backend accepts the absence for a
 *   wallet already bound to the device;
 * - one 401 triggers a device-session refresh and a single replay with
 *   re-minted credentials.
 *
 * The shells construct one {@link DeviceAuthService} in `initChainKit`,
 * which registers it here; the REST services then wrap their `fetch`
 * through {@link createMultichainAuthorizedFetch} without threading the
 * session object through every call site.
 */

let authSession: DeviceAuthService | null = null;

export const setMultichainAuthSession = (session: DeviceAuthService): void => {
    authSession = session;
};

export const getMultichainAuthSession = (): DeviceAuthService | null => authSession;

/** Test-only: drop the singleton so tests don't leak sessions into each other. */
export const _resetMultichainAuthSessionForTests = (): void => {
    authSession = null;
};

export interface MultichainWalletAuthHeadersSource {
    walletId: string;
    /** Absent for accounts created before wallet auth landed — they degrade to device-JWT-only. */
    walletAuthKey?: string;
}

/**
 * Wallet-auth tokens are bound to one access token, so the cache holds
 * at most one JWT generation: a miss on a newer token evicts every
 * entry minted against older ones (same policy as iOS's provider).
 */
const mintedTokens = new Map<string, string>();

const walletAuthHeader = (wallet: MultichainWalletAuthHeadersSource, accessToken: string) => {
    if (!wallet.walletAuthKey) {
        return null;
    }
    const cacheKey = `${wallet.walletId}_${accessToken}`;
    const cached = mintedTokens.get(cacheKey);
    if (cached) {
        return cached;
    }
    for (const key of mintedTokens.keys()) {
        if (!key.endsWith(`_${accessToken}`)) {
            mintedTokens.delete(key);
        }
    }
    const minted = mintWalletAuthToken(wallet.walletAuthKey, accessToken);
    mintedTokens.set(cacheKey, minted);
    return minted;
};

const withAuthHeaders = (
    init: RequestInit | undefined,
    accessToken: string,
    userId: string,
    wallet?: MultichainWalletAuthHeadersSource
): RequestInit => {
    const headers = new Headers(init?.headers);
    headers.set('Authorization', `Bearer ${accessToken}`);
    headers.set('F', userId);
    if (wallet) {
        const token = walletAuthHeader(wallet, accessToken);
        if (token) {
            headers.set('X-Wallet-ID', wallet.walletId);
            headers.set('X-Wallet-Authorization', token);
        }
    }
    return { ...init, headers };
};

/**
 * Wrap `fetchImpl` with the multichain auth headers. Without a device
 * session the request goes out unauthenticated — same degradation as
 * the native apps — and the backend's rejection surfaces to the caller.
 */
export const createMultichainAuthorizedFetch = (
    wallet?: MultichainWalletAuthHeadersSource,
    fetchImpl: typeof fetch = fetch
): typeof fetch => {
    return async (input, init) => {
        const session = authSession;
        const accessToken = session ? await session.getAccessToken() : null;
        if (!session || !accessToken) {
            return fetchImpl(input, init);
        }

        const userId = await session.getUserId();
        const response = await fetchImpl(input, withAuthHeaders(init, accessToken, userId, wallet));
        if (response.status !== 401) {
            return response;
        }

        const refreshed = await session.refreshToken(accessToken);
        if (!refreshed || refreshed === accessToken) {
            return response;
        }
        return fetchImpl(input, withAuthHeaders(init, refreshed, userId, wallet));
    };
};

interface StoredWalletRegistration {
    accounts: MultichainRegisterAccount[];
    registered: boolean;
}

type WalletRegistrationState = Record<string, StoredWalletRegistration>;

const rememberRegistration = async (
    storage: IStorage,
    walletId: string,
    record: StoredWalletRegistration
): Promise<void> => {
    const state =
        (await storage.get<WalletRegistrationState>(AppKey.MULTICHAIN_WALLET_REGISTRATION)) ?? {};
    await storage.set(AppKey.MULTICHAIN_WALLET_REGISTRATION, {
        ...state,
        [walletId]: record
    });
};

const inFlightRegistrations = new Map<string, Promise<void>>();

/**
 * Register the wallet with the backend and persist the outcome. A failed
 * attempt keeps the accounts list so {@link ensureMultichainWalletRegistered}
 * can retry later without the mnemonic — the proof only needs the stored
 * wallet auth key, a fresh challenge, and the device session.
 */
export const registerMultichainWalletAndRemember = async (
    storage: IStorage,
    credentials: MultichainWalletAuthCredentials,
    accounts: MultichainRegisterAccount[]
): Promise<void> => {
    const session = authSession;
    if (!session) {
        await rememberRegistration(storage, credentials.walletId, { accounts, registered: false });
        throw new Error('multichain wallet register: device auth is not initialized');
    }
    try {
        await registerMultichainWallet(session, credentials, accounts);
        await rememberRegistration(storage, credentials.walletId, { accounts, registered: true });
    } catch (e) {
        await rememberRegistration(storage, credentials.walletId, { accounts, registered: false });
        throw e;
    }
};

/**
 * Retry a registration that didn't land (offline creation, backend
 * hiccup). No-op when the wallet is already registered, nothing about it
 * is stored, or the account carries no wallet auth key to sign the proof
 * with. Concurrent callers share one attempt.
 */
export const ensureMultichainWalletRegistered = async (
    storage: IStorage,
    credentials: MultichainWalletAuthHeadersSource
): Promise<void> => {
    const walletAuthKey = credentials.walletAuthKey;
    if (!walletAuthKey) {
        return;
    }
    const pending = inFlightRegistrations.get(credentials.walletId);
    if (pending) {
        return pending;
    }
    const attempt = (async () => {
        const state = await storage.get<WalletRegistrationState>(
            AppKey.MULTICHAIN_WALLET_REGISTRATION
        );
        const record = state?.[credentials.walletId];
        if (!record || record.registered) {
            return;
        }
        await registerMultichainWalletAndRemember(
            storage,
            { walletId: credentials.walletId, walletAuthKey },
            record.accounts
        );
    })().finally(() => {
        inFlightRegistrations.delete(credentials.walletId);
    });
    inFlightRegistrations.set(credentials.walletId, attempt);
    return attempt;
};
