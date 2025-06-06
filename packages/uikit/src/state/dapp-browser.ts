import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryKey } from '../libs/queryKey';
import { useAppSdk } from '../hooks/appSdk';
import { atom } from '@tonkeeper/core/dist/entries/atom';
import { useAtomValue } from '../libs/useAtom';
import {
    BrowserTabBase,
    BrowserTabIdentifier,
    BrowserTabStored,
    getBrowserTabsList,
    setBrowserTabsList
} from '@tonkeeper/core/dist/service/dappBrowserService';
import { OptionalProperty } from '@tonkeeper/core/dist/utils/types';

export type BrowserTab = BrowserTabStored & {
    isLive: boolean;
};

let liveTabs: string[] = [];

const openedTab$ = atom<BrowserTab | BrowserTabIdentifier | 'blanc' | undefined>(undefined);

export const useActiveBrowserTab = () => {
    return useAtomValue(openedTab$);
};

export const useIsBrowserOpened = () => {
    return useAtomValue(openedTab$) !== undefined;
};

export const useOpenBrowserTab = () => {
    const client = useQueryClient();

    return useMutation<
        void,
        Error,
        { id: string } | { url: string; title?: string; iconUrl?: string } | BrowserTab
    >(async tab => {
        if ('isActive' in tab) {
            openedTab$.next('blanc');
            return;
        }
        if ('id' in tab) {
            const tabs = await client.fetchQuery<BrowserTab[]>([QueryKey.browserTabs]);
            const tabToOpen = tabs.find(t => t.id === tab.id);
            if (!tabToOpen) {
                throw new Error('Tab not found');
            }
            openedTab$.next(tabToOpen);
        } else {
            openedTab$.next({ id: Date.now().toString(), ...tab });
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

export const useCloseActiveBrowserTab = (options?: { switchToPreviousTab?: boolean }) => {
    const sdk = useAppSdk();
    const { mutateAsync: removeTab } = useRemoveBrowserTabFromState();
    const client = useQueryClient();

    return useMutation<void, Error>(async () => {
        const tab = openedTab$.value;
        if (!tab) {
            throw new Error('No active tab');
        }
        const tabId = tab !== 'blanc' ? tab.id : undefined;

        let nextTab: BrowserTab | undefined;
        if (options?.switchToPreviousTab) {
            const tabs = (await client.fetchQuery<BrowserTab[]>([QueryKey.browserTabs])).filter(
                t => t.id !== tabId
            );

            if (tabs.length > 0) {
                nextTab = tabs[0];
            }
        }
        openedTab$.next(nextTab);

        if (tabId) {
            sdk.dappBrowser?.close(tabId);
            await removeTab({ id: tabId });
        }
    });
};

export const useBrowserTabs = () => {
    const sdk = useAppSdk();
    return useQuery<BrowserTab[]>([QueryKey.browserTabs], async () => {
        const tabs = await getBrowserTabsList(sdk.storage);
        return tabs.map(t => ({ ...t, isLive: liveTabs.includes(t.id) }));
    });
};

export const useAddBrowserTabToState = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    return useMutation<void, Error, BrowserTabBase>(async tab => {
        if (!liveTabs.includes(tab.id)) {
            liveTabs = [...liveTabs, tab.id];
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
    return useMutation<void, Error, OptionalProperty<BrowserTabStored, 'isPinned'>>(async tab => {
        if (!liveTabs.includes(tab.id)) {
            liveTabs = [...liveTabs, tab.id];
        }

        const tabs = await getBrowserTabsList(sdk.storage);
        const tabToChangeIndex = tabs.findIndex(t => t.id === tab.id);

        // new tab is opened
        if (tabToChangeIndex === -1) {
            tabs.unshift({ isPinned: false, ...tab });
            openedTab$.next(tab);
        }

        tabs[tabToChangeIndex] = { isPinned: false, ...tab };
        await setBrowserTabsList(sdk.storage, tabs);
        await client.invalidateQueries([QueryKey.browserTabs]);
    });
};

const useRemoveBrowserTabFromState = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    return useMutation<void, Error, { id: string }>(async tab => {
        if (!liveTabs.includes(tab.id)) {
            liveTabs = liveTabs.filter(id => id !== tab.id);
        }

        const tabs = await getBrowserTabsList(sdk.storage);
        await setBrowserTabsList(
            sdk.storage,
            tabs.filter(t => t.id !== tab.id)
        );
        await client.invalidateQueries([QueryKey.browserTabs]);
    });
};
