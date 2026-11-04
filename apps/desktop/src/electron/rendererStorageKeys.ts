import { AppKey } from '@tonkeeper/core/dist/Keys';

const mainOnlyKeys: ReadonlySet<string> = new Set([AppKey.KEYCHAIN_SETTINGS]);

const exactKeys: ReadonlySet<string> = new Set([
    ...Object.values(AppKey).filter(key => !mainOnlyKeys.has(key)),
    'TRON_MAM_ACCOUNTS_HAS_BEEN_MIGRATED_KEY',
    'dashboard-columns',
    'setup-password-date'
]);

const keyPrefixes: readonly string[] = [
    `${AppKey.ACCOUNT_CONFIG}_`,
    `${AppKey.BATTERY_AUTH_TOKEN}_`,
    `${AppKey.CONNECTIONS}_`,
    `${AppKey.DEPRECATED_MNEMONIC}_`,
    `${AppKey.DEPRECATED_WALLET}_`,
    `${AppKey.FAVOURITES}_`,
    `${AppKey.HIDDEN_SUGGESTIONS}_`,
    `${AppKey.MULTICHAIN_FAVORITE_RECIPIENTS}_`,
    `${AppKey.TWO_FA_WALLET_CONFIG}::`,
    `${AppKey.WALLET_CONFIG}_`,
    'buy_',
    'catch_',
    'home-banners-hidden:',
    'sell_'
];

export const isRendererStorageKey = (key: unknown): key is string =>
    typeof key === 'string' &&
    (exactKeys.has(key) || keyPrefixes.some(prefix => key.startsWith(prefix)));

export const assertRendererStorageKey = (key: unknown): string => {
    if (!isRendererStorageKey(key)) {
        throw new Error(`Storage key is not available: ${String(key)}`);
    }
    return key;
};
