import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryKey } from '../libs/queryKey';
import { useAppSdk } from '../hooks/appSdk';
import { atom } from '@tonkeeper/core/dist/entries/atom';
import { useAtomValue } from '../libs/useAtom';
import {
    BrowserTabBase,
    BrowserTabLive,
    BrowserTabStored,
    getBrowserTabsList,
    setBrowserTabsList
} from '@tonkeeper/core/dist/service/dappBrowserService';
import { useMemo } from 'react';
import { notNullish } from '@tonkeeper/core/dist/utils/types';

export type BrowserTab =
    | (BrowserTabStored & { isLive: false })
    | (BrowserTabStored & BrowserTabLive);

let liveTabs: { id: string; canGoBack: boolean }[] = [];

const openedTab$ = atom<
    | { type: 'existing'; id: string }
    | { type: 'new'; id: string; url: string; title?: string; iconUrl?: string }
    | 'blanc'
    | undefined
>(undefined);

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
    return useMutation<
        void,
        Error,
        { id: string } | { url: string; title?: string; iconUrl?: string }
    >(async tab => {
        if ('isActive' in tab) {
            openedTab$.next('blanc');
            return;
        }
        if ('id' in tab) {
            openedTab$.next({ type: 'existing', id: tab.id });
        } else {
            openedTab$.next({ type: 'new', id: Date.now().toString(), ...tab });
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

export const useCloseBrowserTab = (options?: { autoSwitchActiveTab?: boolean }) => {
    const sdk = useAppSdk();
    const { mutateAsync: removeTab } = useRemoveBrowserTabFromState();
    const client = useQueryClient();

    return useMutation<void, Error, { id: string }>(async ({ id }) => {
        const tab = openedTab$.value;
        const openedTabId = tab !== 'blanc' ? tab?.id : undefined;

        let nextTab: BrowserTab | undefined;
        if (options?.autoSwitchActiveTab && id === openedTabId) {
            const tabs = (await client.fetchQuery<BrowserTab[]>([QueryKey.browserTabs])).filter(
                t => t.id !== openedTabId
            );

            if (tabs.length > 0) {
                nextTab = tabs[0];
            }
        }

        sdk.dappBrowser?.close(id);
        await removeTab({ id });

        if (openedTabId === id) {
            openedTab$.next(nextTab ? { type: 'existing', id: nextTab?.id } : undefined);
        }
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
export const useAddBrowserTabToState = () => {
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
    return useMutation<void, Error, BrowserTabLive & { isPinned?: boolean }>(async tab => {
        const liveTab = liveTabs.find(lt => lt.id === tab.id);
        if (liveTab) {
            liveTab.canGoBack = tab.canGoBack;
        } else {
            liveTabs = [...liveTabs, tab];
        }

        const tabs = await getBrowserTabsList(sdk.storage);
        const tabToChangeIndex = tabs.findIndex(t => t.id === tab.id);

        // new tab is opened
        if (tabToChangeIndex === -1) {
            tabs.unshift({ isPinned: false, ...tab });
        }

        tabs[tabToChangeIndex] = { isPinned: false, ...tab };
        await setBrowserTabsList(sdk.storage, tabs);
        await client.invalidateQueries([QueryKey.browserTabs]);
        openedTab$.next({ type: 'existing', id: tab.id });
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
