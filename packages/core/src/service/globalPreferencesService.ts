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
    /**
     * Avatar colour per account, as a `WALLET_COLORS` id (see
     * `entries/walletColor`). Kept here rather than on the `Account`
     * classes: it is presentation metadata keyed by account id, like
     * `sideBarOrder` and `folders`, and storing it here needs no change to
     * the nine account shapes on disk. Accounts absent from the map fall
     * back to `defaultWalletColor`.
     */
    walletColors: Record<string, string>;
}

const defaultGlobalPreferences: GlobalPreferences = {
    folders: [],
    sideBarOrder: [],
    historyFilterSpam: false,
    highlightFeatures: {
        tron: true
    },
    interceptTonLinks: 'ask',
    walletColors: {}
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
