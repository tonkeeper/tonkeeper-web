import { AppKey } from '../Keys';
import { IStorage } from '../Storage';

export const getSubscribed = async (storage: IStorage, wallet: string) => {
    const result = await storage.get<boolean>(`${AppKey.SUBSCRIPTION}_${wallet}`);
    return result ?? false;
};

export const setSubscribed = async (storage: IStorage, wallet: string, value: boolean) => {
    await storage.set(`${AppKey.SUBSCRIPTION}_${wallet}`, value);
};
