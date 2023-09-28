import { AppKey } from '../Keys';
import { IStorage } from '../Storage';

export const getSubscribed = async (storage: IStorage, wallet: string) => {
    const value = window.localStorage.getItem(`${AppKey.SUBSCRIPTION}_${wallet}`);
    return value === 'true';
};

export const setSubscribed = async (storage: IStorage, wallet: string, value: boolean) => {
    window.localStorage.setItem(`${AppKey.SUBSCRIPTION}_${wallet}`, value ? 'true' : 'false');
};
