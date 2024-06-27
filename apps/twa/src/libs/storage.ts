import { CloudStorage, initCloudStorage } from '@tma.js/sdk';
import { IStorage } from '@tonkeeper/core/dist/Storage';

export class TwaStorage implements IStorage {
    cloudStorage: CloudStorage;

    constructor() {
        this.cloudStorage = initCloudStorage();
    }

    get = async <R>(key: string) => {
        const value = await this.cloudStorage.get(key, { timeout: 1000 });
        if (!value) return null;
        const { payload } = JSON.parse(value) as { payload: R };
        return payload;
    };

    set = async <R>(key: string, payload: R) => {
        await this.cloudStorage.set(key, JSON.stringify({ payload }));
        return payload;
    };

    setBatch = async <V extends Record<string, unknown>>(values: V) => {
        for (let [key, payload] of Object.entries(values)) {
            this.set(key, payload);
        }
        return values;
    };

    delete = async <R>(key: string) => {
        const payload = await this.get<R>(key);
        if (payload != null) {
            await this.cloudStorage.delete([key]);
        }
        return payload;
    };

    clear = async () => {
        const keys = await this.cloudStorage.getKeys();
        await this.cloudStorage.delete(keys);
    };
}
