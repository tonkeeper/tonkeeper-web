// eslint-disable-next-line max-classes-per-file
import { IStorage } from '@tonkeeper/core/dist/Storage';
import { AppKey } from '@tonkeeper/core/dist/Keys';

export class SwapWidgetStorage implements IStorage {
    private permanentStorage = new BrowserPermanentStorage();

    private temporaryStorage = new BrowserTemporaryStorage();

    private storageByKey = (key: string) => {
        if (key === AppKey.SWAP_OPTIONS) {
            return this.permanentStorage;
        }

        return this.temporaryStorage;
    };

    get = async <R>(key: string) => {
        return this.storageByKey(key).get<R>(key);
    };

    set = async <R>(key: string, payload: R) => {
        return this.storageByKey(key).set<R>(key, payload);
    };

    setBatch = async <V extends Record<string, unknown>>(values: V) => {
        Object.entries(values).forEach(([key, payload]) => {
            this.set(key, payload);
        });
        return values;
    };

    delete = async <R>(key: string) => {
        return this.storageByKey(key).delete<R>(key);
    };

    clear = async () => {
        await this.temporaryStorage.clear();
        await this.permanentStorage.clear();
    };
}

class BrowserPermanentStorage implements IStorage {
    prefix = 'tonkeeper-swap-widget';

    get = async <R>(key: string) => {
        const value = localStorage.getItem(`${this.prefix}_${key}`);
        if (!value) return null;
        const { payload } = JSON.parse(value) as { payload: R };
        return payload;
    };

    set = async <R>(key: string, payload: R) => {
        localStorage.setItem(`${this.prefix}_${key}`, JSON.stringify({ payload }));
        return payload;
    };

    setBatch = async <V extends Record<string, unknown>>(values: V) => {
        Object.entries(values).forEach(([key, payload]) => {
            localStorage.setItem(`${this.prefix}_${key}`, JSON.stringify({ payload }));
        });
        return values;
    };

    delete = async <R>(key: string) => {
        const payload = await this.get<R>(key);
        if (payload != null) {
            localStorage.removeItem(`${this.prefix}_${key}`);
        }
        return payload;
    };

    clear = async () => {
        localStorage.clear();
    };
}

class BrowserTemporaryStorage implements IStorage {
    private storage = new Map<string, unknown>();

    get = async <R>(key: string) => {
        const value = this.storage.get(key);
        if (value == null) {
            return null;
        }

        return value as R;
    };

    set = async <R>(key: string, payload: R) => {
        this.storage.set(key, payload);
        return payload;
    };

    setBatch = async <V extends Record<string, unknown>>(values: V) => {
        Object.entries(values).forEach(([key, payload]) => {
            this.storage.set(key, payload);
        });
        return values;
    };

    delete = async <R>(key: string) => {
        const payload = this.storage.get(key);
        this.storage.delete(key);
        return payload as R | null;
    };

    clear = async () => {
        this.storage.clear();
    };
}
