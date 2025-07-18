import { IStorage } from '../Storage';
import { AccountsFolderStored } from '../entries/account';
import { AppKey } from '../Keys';

export type InterceptTonLinksConfig = 'always' | 'never' | 'ask';

export interface GlobalPreferences {
    folders: AccountsFolderStored[];
    sideBarOrder: string[];
    historyFilterSpam: boolean;
    highlightFeatures: {
        tron: boolean;
    };
    interceptTonLinks: InterceptTonLinksConfig;
}

const defaultGlobalPreferences: GlobalPreferences = {
    folders: [],
    sideBarOrder: [],
    historyFilterSpam: false,
    highlightFeatures: {
        tron: true
    },
    interceptTonLinks: 'ask'
};

export async function getGlobalPreferences(storage: IStorage) {
    const data = await storage.get<Partial<GlobalPreferences>>(AppKey.GLOBAL_PREFERENCES_CONFIG);
    if (!data) {
        return defaultGlobalPreferences;
    }
    return { ...defaultGlobalPreferences, ...data };
}

export async function setGlobalPreferences(
    storage: IStorage,
    preferences: Partial<GlobalPreferences>
) {
    const current = await getGlobalPreferences(storage);
    await storage.set(AppKey.GLOBAL_PREFERENCES_CONFIG, { ...current, ...preferences });
}
