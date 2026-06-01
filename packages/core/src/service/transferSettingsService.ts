import { IStorage } from '../Storage';
import { AppKey } from '../Keys';

export type TransferFeeMethod = 'external' | 'battery' | 'gasless';

export interface TransferSettings {
    feeMethod: TransferFeeMethod | null;
}

const defaultTransferSettings: TransferSettings = { feeMethod: null };

export async function getTransferSettings(storage: IStorage): Promise<TransferSettings> {
    const data = await storage.get<Partial<TransferSettings>>(AppKey.TRANSFER_SETTINGS);
    if (!data) {
        return defaultTransferSettings;
    }
    return { ...defaultTransferSettings, ...data };
}

export async function setTransferSettings(
    storage: IStorage,
    settings: Partial<TransferSettings>
): Promise<void> {
    const current = await getTransferSettings(storage);
    await storage.set(AppKey.TRANSFER_SETTINGS, { ...current, ...settings });
}
