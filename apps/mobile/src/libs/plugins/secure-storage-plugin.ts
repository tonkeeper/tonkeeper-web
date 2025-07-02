import { registerPlugin } from '@capacitor/core';

export interface SecureStoragePlugin {
    storeData(params: { id: string; data: string }): Promise<void>;

    getData(params: { id: string }): Promise<{ data: string }>;

    removeData(params: { id: string }): Promise<void>;

    clearStorage(): Promise<void>;
}

export const SecureStorage = registerPlugin<SecureStoragePlugin>('SecureStorage', {
    web: () => {
        return {
            async storeData(params: { id: string; data: string }) {
                localStorage.setItem(
                    '[TK_MOBILE_WEB_SECURE_STORAGE_IMPL]' + params.id,
                    params.data
                );
            },
            async getData(params: { id: string }): Promise<{ data: string }> {
                return {
                    data: localStorage.getItem('[TK_MOBILE_WEB_SECURE_STORAGE_IMPL]' + params.id)!
                };
            },
            async removeData(params: { id: string }) {
                localStorage.removeItem('[TK_MOBILE_WEB_SECURE_STORAGE_IMPL]' + params.id);
            },
            async clearStorage() {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key?.startsWith('[TK_MOBILE_WEB_SECURE_STORAGE_IMPL]')) {
                        localStorage.removeItem(key);
                    }
                }
            }
        };
    }
});
