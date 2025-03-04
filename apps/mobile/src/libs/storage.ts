import { IStorage } from '@tonkeeper/core/dist/Storage';
import { Preferences } from '@capacitor/preferences';

export class CapacitorStorage implements IStorage {
    get = async <R>(key: string): Promise<R | null> => {
        const { value } = await Preferences.get({ key });
        return value ? (JSON.parse(value) as R) : null;
    };

    set = async <R>(key: string, value: R) => {
        await Preferences.set({ key, value: JSON.stringify(value) });
        return value;
    };

    setBatch = async <V extends Record<string, unknown>>(values: V) => {
        const operations = Object.entries(values).map(([key, value]) =>
            Preferences.set({ key, value: JSON.stringify(value) })
        );
        await Promise.all(operations);
        return values;
    };

    delete = async <R>(key: string) => {
        const payload = await this.get<R>(key);
        if (payload !== null) {
            await Preferences.remove({ key });
        }
        return payload;
    };

    clear = async (): Promise<void> => {
        await Preferences.clear();
    };
}
