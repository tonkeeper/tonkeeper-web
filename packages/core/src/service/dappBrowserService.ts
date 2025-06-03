import { IStorage } from '../Storage';
import { AppKey } from '../Keys';

export type BrowserTabIdentifier = {
    id: string;
    /**
     * Opened url if dapp is not connected, otherwise the url from manifest url
     */
    url: string;
};

export type BrowserTabBase = BrowserTabIdentifier & {
    title: string;
    iconUrl: string;
};

export type BrowserTabStored = BrowserTabBase & {
    isPinned: boolean;
};

export async function getBrowserTabsList(storage: IStorage): Promise<BrowserTabStored[]> {
    return (await storage.get(AppKey.BROWSER_TABS)) ?? [];
}

export async function setBrowserTabsList(
    storage: IStorage,
    tabs: BrowserTabStored[]
): Promise<void> {
    await storage.set(AppKey.BROWSER_TABS, tabs);
}

export async function patchBrowserTab(storage: IStorage, tab: BrowserTabStored): Promise<void> {
    const tabs = await getBrowserTabsList(storage);
    const index = tabs.findIndex(t => t.id === tab.id);
    if (index === -1) {
        throw new Error('Tab not found');
    }
    tabs[index] = tab;
    await setBrowserTabsList(storage, tabs);
}
