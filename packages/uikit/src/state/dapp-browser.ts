import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryKey } from '../libs/queryKey';
import { useAppSdk } from '../hooks/appSdk';
import { atom } from '@tonkeeper/core/dist/entries/atom';
import { useAtomValue } from '../libs/useAtom';
import {
    BrowserTabBase,
    BrowserTabIdentifier,
    BrowserTabLive,
    BrowserTabStored,
    getBrowserTabsList,
    getSearchEngineRecommendations,
    setBrowserTabsList
} from '@tonkeeper/core/dist/service/dappBrowserService';
import { useCallback, useMemo } from 'react';
import { notNullish } from '@tonkeeper/core/dist/utils/types';
import { delay } from '@tonkeeper/core/dist/utils/common';

export type BrowserTab =
    | (BrowserTabStored & { isLive: false })
    | (BrowserTabStored & BrowserTabLive);

export type LoadingBrowserTab = {
    type: 'loading';
    id: string;
    url: string;
    title?: string;
    iconUrl?: string;
};

let liveTabs: { id: string; canGoBack: boolean }[] = [];

const openedTab$ = atom<{ type: 'existing'; id: string } | LoadingBrowserTab | 'blanc' | undefined>(
    undefined
);

export const useActiveBrowserTab = () => {
    const openedTab = useAtomValue(openedTab$);
    const { data: tabs } = useBrowserTabs();

    return useMemo(() => {
        if (!tabs || !openedTab) {
            return undefined;
        }
        if (openedTab === 'blanc') {
            return 'blanc';
        }

        if (openedTab.type === 'existing') {
            return tabs.find(t => t.id === openedTab.id);
        }
        return openedTab;
    }, [tabs, openedTab]);
};

export const useIsBrowserOpened = () => {
    return useAtomValue(openedTab$) !== undefined;
};

export const useOpenBrowserTab = () => {
    const sdk = useAppSdk();
    const { mutate: addToState } = useAddBrowserTabToState();
    const client = useQueryClient();

    return useMutation<
        void,
        Error,
        { id: string } | { url: string; title?: string; iconUrl?: string } | 'blanc'
    >(async tab => {
        if (tab === 'blanc') {
            openedTab$.next('blanc');
            return;
        }

        const loadTab = async (t: BrowserTabIdentifier) => {
            const shownTab = await sdk.dappBrowser!.open(t.url, {
                id: t.id
            });
            addToState(shownTab);
            await delay(800);

            openedTab$.next({ type: 'existing', id: t.id });
        };

        if ('id' in tab) {
            const existingTabs = await client.fetchQuery<BrowserTab[]>([QueryKey.browserTabs]);
            const existingTab = existingTabs.find(({ id }) => id === tab.id);
            if (!existingTab) {
                throw new Error('Could not find browser tab');
            }

            if (existingTab.isLive) {
                openedTab$.next({ type: 'existing', id: tab.id });

                const shownTab = await sdk.dappBrowser!.open(existingTab.url, {
                    id: existingTab.id
                });
                addToState(shownTab);
            } else {
                openedTab$.next({ type: 'loading', ...existingTab });

                await loadTab(existingTab);
            }
        } else {
            const tabId = Date.now().toString();
            openedTab$.next({ type: 'loading', id: tabId, ...tab });

            await loadTab({ id: tabId, url: tab.url });
        }
    });
};

export const useHideActiveBrowserTab = () => {
    const sdk = useAppSdk();
    return useMutation<void, Error>(async () => {
        const tab = openedTab$.value;
        if (!tab) {
            return;
        }

        if (tab !== 'blanc') {
            sdk.dappBrowser?.hide(tab.id);
        }

        openedTab$.next(undefined);
    });
};

export const useCloseActiveBrowserTab = () => {
    const sdk = useAppSdk();
    const { mutateAsync: removeTab } = useRemoveBrowserTabFromState();

    return useMutation<void, Error>(async () => {
        const tab = openedTab$.value;
        if (!tab) {
            throw new Error('No active tab');
        }
        const tabId = tab !== 'blanc' ? tab.id : undefined;

        if (tabId) {
            sdk.dappBrowser?.close(tabId);
            await removeTab({ id: tabId });
        }
        openedTab$.next(undefined);
    });
};

export const useCloseBrowserTab = () => {
    const sdk = useAppSdk();
    const { mutateAsync: removeTab } = useRemoveBrowserTabFromState();

    return useMutation<void, Error, { id: string }>(async ({ id }) => {
        const tab = openedTab$.value;
        const openedTabId = tab !== 'blanc' ? tab?.id : undefined;

        sdk.dappBrowser?.close(id);
        await removeTab({ id });

        if (openedTabId === id) {
            openedTab$.next(undefined);
        }
    });
};

export const useCloseAllBrowserTabs = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();

    return useMutation<void, Error>(async () => {
        const tab = openedTab$.value;
        const openedTabId = tab !== 'blanc' ? tab?.id : undefined;

        const tabs = await client.fetchQuery<BrowserTab[]>([QueryKey.browserTabs]);

        if (!tabs || !tabs.length) {
            return;
        }

        sdk.dappBrowser?.close(tabs.map(t => t.id));
        liveTabs = [];
        if (openedTabId) {
            openedTab$.next(undefined);
        }
        await setBrowserTabsList(sdk.storage, []);
        await client.invalidateQueries([QueryKey.browserTabs]);
    });
};

export const useBrowserTabs = () => {
    const sdk = useAppSdk();
    return useQuery<BrowserTab[]>(
        [QueryKey.browserTabs],
        async () => {
            const tabs = await getBrowserTabsList(sdk.storage);
            return tabs.map(t => ({
                ...t,
                isLive: liveTabs.some(lt => lt.id === t.id),
                canGoBack: liveTabs.find(lt => lt.id === t.id)?.canGoBack ?? false
            }));
        },
        {
            keepPreviousData: true
        }
    );
};

export const useReorderBrowserTabs = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();

    return useMutation({
        mutationFn: async (tabs: BrowserTabStored[]) => {
            await setBrowserTabsList(sdk.storage, tabs);
        },
        onMutate: newTabs => {
            const previousTabs = client.getQueryData<BrowserTab[]>([QueryKey.browserTabs]);

            if (!previousTabs) {
                return { previousTabs };
            }

            const sortedPreviousTabs = newTabs
                .map(nt => previousTabs.find(pt => nt.id === pt.id))
                .filter(notNullish) as BrowserTab[];

            client.setQueryData([QueryKey.browserTabs], sortedPreviousTabs);

            return { previousTabs };
        },
        onError: (_, __, context) => {
            if (context?.previousTabs) {
                client.setQueryData([QueryKey.browserTabs], context.previousTabs);
            }
        },
        onSettled: () => {
            client.invalidateQueries({ queryKey: [QueryKey.browserTabs] });
        }
    });
};
const useAddBrowserTabToState = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    return useMutation<void, Error, BrowserTabBase>(async tab => {
        if (!liveTabs.some(lt => lt.id === tab.id)) {
            liveTabs = [...liveTabs, { id: tab.id, canGoBack: false }];
        }
        const tabs = await getBrowserTabsList(sdk.storage);
        if (!tabs.some(t => t.id === tab.id)) {
            await setBrowserTabsList(sdk.storage, [{ isPinned: false, ...tab }, ...tabs]);
        }
        await client.invalidateQueries([QueryKey.browserTabs]);
    });
};

export const useChangeBrowserTab = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    return useMutation<void, Error, BrowserTab | BrowserTabLive>(async tab => {
        if (tab.isLive) {
            const liveTab = liveTabs.find(lt => lt.id === tab.id);
            if (liveTab) {
                liveTab.canGoBack = tab.canGoBack;
            } else {
                liveTabs = [...liveTabs, tab];
            }
        }

        const tabs = await getBrowserTabsList(sdk.storage);
        const tabToChangeIndex = tabs.findIndex(t => t.id === tab.id);
        let firstNotPinnedTabIndex = tabs.findIndex(t => !t.isPinned);
        firstNotPinnedTabIndex =
            firstNotPinnedTabIndex === -1 ? tabs.length : firstNotPinnedTabIndex;

        let shouldChangeOpenedTab = false;
        // new tab is opened
        if (tabToChangeIndex === -1) {
            tabs.splice(firstNotPinnedTabIndex, 0, { isPinned: false, ...tab });
            shouldChangeOpenedTab = true;
        } else {
            const prevTab = tabs[tabToChangeIndex];
            const newTab = { isPinned: prevTab.isPinned, ...tab };

            // Tab became pinned or unpinned -- move to the bottom of pinned tabs zone or to the top of not pinned tabs zone.
            // This positions indexes are same basically
            if (prevTab.isPinned !== newTab.isPinned) {
                tabs.splice(tabToChangeIndex, 1);
                tabs.splice(firstNotPinnedTabIndex, 0, newTab);
            } else {
                tabs[tabToChangeIndex] = newTab;
            }
        }
        await setBrowserTabsList(sdk.storage, tabs);
        await client.invalidateQueries([QueryKey.browserTabs]);
        if (shouldChangeOpenedTab) {
            openedTab$.next({ type: 'existing', id: tab.id });
        }
    });
};

const useRemoveBrowserTabFromState = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    return useMutation<void, Error, { id: string }>(async tab => {
        if (!liveTabs.some(lt => lt.id === tab.id)) {
            liveTabs = liveTabs.filter(lt => lt.id !== tab.id);
        }

        const tabs = await getBrowserTabsList(sdk.storage);
        await setBrowserTabsList(
            sdk.storage,
            tabs.filter(t => t.id !== tab.id)
        );
        await client.invalidateQueries([QueryKey.browserTabs]);
    });
};

export const useSearchEngine = () => {
    return useCallback((query: string) => `https://duckduckgo.com/?q=${query}`, []);
};

export const useSearchEngineName = () => {
    return 'DuckDuckGo';
};

export const useSearchEngineRecommendations = (query: string) => {
    return useQuery([QueryKey.searchEngineRecommendations, query], async () => {
        if (query.length < 2) {
            return [];
        }
        const result = await getSearchEngineRecommendations(query);
        return result.slice(0, 4);
    });
};
