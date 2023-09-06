import { IAppSdk } from '@tonkeeper/core/dist/AppSdk';

interface BrowserCache<T> {
    timeout: number;
    data: T;
}

export const removeCachedStoreValue = async (sdk: IAppSdk, query: string) => {
    await sdk.storage.set(`catch_${query}`, null);
};

export const getCachedStoreValue = async <T>(sdk: IAppSdk, query: string): Promise<T | null> => {
    return sdk.storage.get<string>(`catch_${query}`).then<T | null>(async result => {
        if (result == null) return null;
        const data: BrowserCache<T> = JSON.parse(result);
        if (data.timeout < Date.now()) {
            await removeCachedStoreValue(sdk, query);
            return null;
        } else {
            return data.data;
        }
    });
};

const tenMin = 10 * 60 * 1000;

export const setCachedStoreValue = async <T>(
    sdk: IAppSdk,
    query: string,
    data: T,
    timeout: number = Date.now() + tenMin
) => {
    await sdk.storage.set(`catch_${query}`, JSON.stringify({ data, timeout }));
};
