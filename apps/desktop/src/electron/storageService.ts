import { IStorage } from '@tonkeeper/core/dist/Storage';
import Store from 'electron-store';

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
