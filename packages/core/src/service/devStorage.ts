import { IStorage } from '../Storage';
import { Network } from '../entries/network';
import { AppKey } from '../Keys';

export interface DevSettings {
    enableV5: boolean;
    tonNetwork: Network;
}

const defaultDevSettings: DevSettings = {
    enableV5: false,
    tonNetwork: Network.MAINNET
};

export const getDevSettings = async (storage: IStorage) => {
    const settings = await storage.get<DevSettings>(AppKey.DEV_SETTINGS);
    return {
        ...defaultDevSettings,
        ...settings
    };
};

export const setDevSettings = async (storage: IStorage, settings: Partial<DevSettings>) => {
    const current = await getDevSettings(storage);
    await storage.set(AppKey.DEV_SETTINGS, { ...current, ...settings });
};
