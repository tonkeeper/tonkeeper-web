import { registerPlugin } from '@capacitor/core';

export interface DeviceStoragePlugin {
    get(params: { key: string }): Promise<{ value: string | null }>;

    set(params: { key: string; value: string }): Promise<{ value: string }>;

    setBatch(params: { values: Record<string, string> }): Promise<{ values: Record<string, string> }>;

    delete(params: { key: string }): Promise<{ value: string | null }>;

    clear(): Promise<void>;
}

export const DeviceStorage = registerPlugin<DeviceStoragePlugin>('DeviceStorage', {
    web: () => {
        const WEB_DEVICE_STORAGE_PREFIX = '[TK_MOBILE_WEB_DEVICE_STORAGE_IMPL]';

        return {
            async get(params: { key: string }): Promise<{ value: string | null }> {
                const value = localStorage.getItem(WEB_DEVICE_STORAGE_PREFIX + params.key);
                return { value };
            },

            async set(params: { key: string; value: string }): Promise<{ value: string }> {
                localStorage.setItem(WEB_DEVICE_STORAGE_PREFIX + params.key, params.value);
                return { value: params.value };
            },

            async setBatch(params: { values: Record<string, string> }): Promise<{ values: Record<string, string> }> {
                Object.entries(params.values).forEach(([key, value]) => {
                    localStorage.setItem(WEB_DEVICE_STORAGE_PREFIX + key, value);
                });
                return { values: params.values };
            },

            async delete(params: { key: string }): Promise<{ value: string | null }> {
                const value = localStorage.getItem(WEB_DEVICE_STORAGE_PREFIX + params.key);
                localStorage.removeItem(WEB_DEVICE_STORAGE_PREFIX + params.key);
                return { value };
            },

            async clear(): Promise<void> {
                const keysToRemove: string[] = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key?.startsWith(WEB_DEVICE_STORAGE_PREFIX)) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(key => localStorage.removeItem(key));
            }
        };
    }
});