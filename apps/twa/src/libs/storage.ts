import { IStorage } from '@tonkeeper/core/dist/Storage';
import { CloudStorage } from '@twa.js/sdk';

export class TwaStorage implements IStorage {
    constructor(private cloudStorage: CloudStorage) {}

    get = async <R>(key: string) => {
        const value = await this.cloudStorage.getValues([key]);
        if (!value || !value[key]) return null;
        const { payload } = JSON.parse(value[key]) as { payload: R };
        return payload;
    };

    set = async <R>(key: string, payload: R) => {
        await this.cloudStorage.saveValue(key, JSON.stringify({ payload }));
        return payload;
    };

    setBatch = async <V extends Record<string, unknown>>(values: V) => {
        for (let [key, payload] of Object.entries(values)) {
            await this.set(key, payload);
        }
        return values;
    };

    delete = async <R>(key: string) => {
        const payload = await this.get<R>(key);
        if (payload != null) {
            await this.cloudStorage.deleteKeys([key]);
        }
        return payload;
    };

    clear = async () => {
        const keys = await this.cloudStorage.getKeys();
        await this.cloudStorage.deleteKeys(keys);
    };
}
