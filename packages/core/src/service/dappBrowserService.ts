import { IStorage } from '../Storage';
import { AppKey } from '../Keys';
import { z } from 'zod';

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

export type BrowserTabLive = BrowserTabBase & {
    isLive: true;
    canGoBack: boolean;
};

export function isBrowserTabLive(
    tab: BrowserTabIdentifier | BrowserTabLive
): tab is BrowserTabLive {
    return 'isLive' in tab && tab.isLive;
}

export async function getBrowserTabsList(storage: IStorage): Promise<BrowserTabStored[]> {
    return (await storage.get(AppKey.BROWSER_TABS)) ?? [];
}

export async function setBrowserTabsList(
    storage: IStorage,
    tabs: BrowserTabStored[]
): Promise<void> {
    await storage.set(
        AppKey.BROWSER_TABS,
        tabs.map(
            t =>
                ({
                    id: t.id,
                    url: t.url,
                    title: t.title,
                    iconUrl: t.iconUrl,
                    isPinned: t.isPinned
                } satisfies BrowserTabStored)
        )
    );
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

const duckDuckGoSuggestionsSchema = z.array(z.object({ phrase: z.string() }));

export async function getSearchEngineRecommendations(query: string) {
    const result = await (await fetch(`https://duckduckgo.com/ac/?q=${query}`)).json();
    const parsed = duckDuckGoSuggestionsSchema.parse(result);

    return parsed.map(i => i.phrase);
}
