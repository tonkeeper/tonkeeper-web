import { CloudStorage, initCloudStorage } from '@tma.js/sdk';
import { IStorage } from '@tonkeeper/core/dist/Storage';

export class TwaStorage implements IStorage {
    cloudStorage: CloudStorage;

    constructor() {
        this.cloudStorage = initCloudStorage();
    }

    private timeout = 500;

    private stringToHash(string: string) {
        let hash = 0;

        if (string.length === 0) {
            throw new Error('Unexpected string');
        }

        for (const char of string) {
            hash ^= char.charCodeAt(0); // Bitwise XOR operation
        }

        return String(hash);
    }

    private innerGet = async <R>(key: string) => {
        try {
            return await this.cloudStorage.get(key, { timeout: this.timeout });
        } catch (e) {
            if (e instanceof Error && e.message.startsWith('Timeout')) {
                return await this.cloudStorage.get(this.stringToHash(key), {
                    timeout: this.timeout
                });
            } else {
                throw e;
            }
        }
    };

    private innerGetWithKey = async <R>(key: string) => {
        try {
            return [await this.cloudStorage.get(key, { timeout: this.timeout }), key] as const;
        } catch (e) {
            if (e instanceof Error && e.message.startsWith('Timeout')) {
                return [
                    await this.cloudStorage.get(this.stringToHash(key), { timeout: this.timeout }),
                    this.stringToHash(key)
                ] as const;
            } else {
                throw e;
            }
        }
    };

    private innerSet = async <R>(key: string, payload: string) => {
        try {
            await this.cloudStorage.set(key, payload, { timeout: this.timeout });
        } catch (e) {
            if (e instanceof Error && e.message.startsWith('Timeout')) {
                return await this.cloudStorage.set(this.stringToHash(key), payload, {
                    timeout: this.timeout
                });
            } else {
                throw e;
            }
        }
    };

    get = async <R>(key: string) => {
        const value = await this.innerGet(key);
        if (!value) return null;
        const { payload } = JSON.parse(value) as { payload: R };
        return payload;
    };

    set = async <R>(key: string, payload: R) => {
        await this.innerSet(key, JSON.stringify({ payload }));
        return payload;
    };

    setBatch = async <V extends Record<string, unknown>>(values: V) => {
        for (let [key, payload] of Object.entries(values)) {
            this.set(key, payload);
        }
        return values;
    };

    delete = async <R>(key: string) => {
        const [value, innerKey] = await this.innerGetWithKey(key);
        if (!value) return null;
        await this.cloudStorage.delete([innerKey]);
        const { payload } = JSON.parse(value) as { payload: R };
        return payload;
    };

    clear = async () => {
        const keys = await this.cloudStorage.getKeys();
        await this.cloudStorage.delete(keys);
    };
}
