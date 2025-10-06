import { registerPlugin } from '@capacitor/core';

export interface DeviceStoragePlugin {
    get<R>(params: { key: string }): Promise<{ value: R | null }>;

    set<R>(params: { key: string; value: R }): Promise<{ value: R }>;

    setBatch<V extends Record<string, unknown>>(params: { values: V }): Promise<{ values: V }>;

    delete<R>(params: { key: string }): Promise<{ value: R | null }>;

    clear(): Promise<void>;
}

export const DeviceStorage = registerPlugin<DeviceStoragePlugin>('DeviceStorage', {
    web: () => {
        const WEB_KEYCHAIN_PREFIX = '[TK_MOBILE_WEB_KEYCHAIN_STORAGE_IMPL]';

        return {
            async get<R>(params: { key: string }): Promise<{ value: R | null }> {
                const value = localStorage.getItem(WEB_KEYCHAIN_PREFIX + params.key);
                return {
                    value: value ? (JSON.parse(value) as R) : null
                };
            },

            async set<R>(params: { key: string; value: R }): Promise<{ value: R }> {
                localStorage.setItem(
                    WEB_KEYCHAIN_PREFIX + params.key,
                    JSON.stringify(params.value)
                );
                return { value: params.value };
            },

            async setBatch<V extends Record<string, unknown>>(params: {
                values: V;
            }): Promise<{ values: V }> {
                Object.entries(params.values).forEach(([key, value]) => {
                    localStorage.setItem(WEB_KEYCHAIN_PREFIX + key, JSON.stringify(value));
                });
                return { values: params.values };
            },

            async delete<R>(params: { key: string }): Promise<{ value: R | null }> {
                const value = localStorage.getItem(WEB_KEYCHAIN_PREFIX + params.key);
                localStorage.removeItem(WEB_KEYCHAIN_PREFIX + params.key);
                return {
                    value: value ? (JSON.parse(value) as R) : null
                };
            },

            async clear(): Promise<void> {
                const keysToRemove: string[] = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key?.startsWith(WEB_KEYCHAIN_PREFIX)) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(key => localStorage.removeItem(key));
            }
        };
    }
});
