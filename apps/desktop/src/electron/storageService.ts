import { IStorage } from '@tonkeeper/core/dist/Storage';
import Store from 'electron-store';
import { assertRendererStorageKey, isRendererStorageKey } from './rendererStorageKeys';

export const electronStore = new Store();

class NodeStorage implements IStorage {
    get = async <R>(key: string) => {
        return electronStore.get(key, null) as R | null;
    };

    set = async <R>(key: string, value: R) => {
        electronStore.set(key, value);
        return value;
    };

    setBatch = async <V extends Record<string, unknown>>(value: V) => {
        Object.entries(value).forEach(([key, v]) => {
            electronStore.set(key, v);
        });
        return value;
    };

    delete = async <R>(key: string) => {
        const value = electronStore.get(key, null) as R | null;
        if (value) {
            electronStore.delete(key);
        }
        return value;
    };

    clear = async () => {
        return electronStore.clear();
    };
}

export const mainStorage = new NodeStorage();

export const rendererStorage: IStorage = {
    get: async <R>(key: string) => mainStorage.get<R>(assertRendererStorageKey(key)),

    set: async <R>(key: string, value: R) => mainStorage.set(assertRendererStorageKey(key), value),

    setBatch: async <V extends Record<string, unknown>>(value: V) => {
        Object.keys(value).forEach(assertRendererStorageKey);
        return mainStorage.setBatch(value);
    },

    delete: async <R>(key: string) => mainStorage.delete<R>(assertRendererStorageKey(key)),

    clear: async () => {
        Object.keys(electronStore.store)
            .filter(isRendererStorageKey)
            .forEach(key => electronStore.delete(key));
    }
};
