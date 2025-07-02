import { PluginListenerHandle, registerPlugin } from '@capacitor/core';
import { IDappBrowser } from '@tonkeeper/core/dist/AppSdk';
import { BrowserTabBase, BrowserTabLive } from '@tonkeeper/core/dist/service/dappBrowserService';
import { subject } from '@tonkeeper/core/dist/entries/atom';
import { eqOrigins, originFromUrl } from '@tonkeeper/core/dist/service/tonConnect/connectService';

interface DocumentMetadata {
    title: string;
    iconUrl: string;
}

interface IDappBrowserPlugin {
    open(params: { id: string; url: string; focusDappView?: boolean }): Promise<DocumentMetadata>;
    hide(params: { id?: string }): Promise<void>;
    close(params: { ids: string[] }): Promise<void>;
    reload(params: { ids: string[] }): Promise<void>;
    goBack(params: { id: string }): Promise<void>;
    setOffset(params: { top: number; bottom: number }): Promise<void>;
    setIsMainViewInFocus(params: { focus: boolean }): Promise<void>;
    addListener(
        eventName: 'browserMessageReceived',
        listenerFunc: (data: {
            webViewId: string;
            queryId: string;
            payload: string;
            webViewOrigin: string;
        }) => void
    ): Promise<PluginListenerHandle>;
    addListener(
        eventName: 'browserUrlChanged',
        listenerFunc: (
            data: {
                webViewId: string;
                url: string;
                canGoBack: boolean;
            } & DocumentMetadata
        ) => void
    ): Promise<PluginListenerHandle>;
    addListener(
        eventName: 'browserTabOpened',
        listenerFunc: (
            data: {
                webViewId: string;
                url: string;
            } & DocumentMetadata
        ) => void
    ): Promise<PluginListenerHandle>;
    sendToBrowser(params: { webViewId: string; queryId?: string; payload: string }): Promise<void>;
}

const DappBrowserPlugin = registerPlugin<IDappBrowserPlugin>('DappBrowser', {
    web: () => {
        return {
            async open() {
                return Promise.resolve({
                    title: 'Example tab 1',
                    iconUrl: 'https://capacitorjs.com/docs/img/meta/favicon.png'
                });
            },
            async hide() {
                return Promise.resolve();
            },
            async show() {
                return Promise.resolve();
            },
            async close() {
                return Promise.resolve();
            }
        };
    }
});

class DappBrowser implements IDappBrowser {
    private requestsHandlers = new Map<
        string,
        (
            rpcParams: Record<string, unknown>,
            ctx: {
                webViewId: string;
                webViewOrigin: string;
            }
        ) => Promise<unknown>
    >();

    tabChange = subject<BrowserTabLive>();

    private liveTabs: BrowserTabLive[] = [];

    private mainWindowFocusController = new MainWindowFocusController((focus: boolean) =>
        DappBrowserPlugin.setIsMainViewInFocus({ focus })
    );

    constructor() {
        DappBrowserPlugin.addListener('browserMessageReceived', async data => {
            const parsed = JSON.parse(data.payload) as {
                method: string;
                params: Record<string, unknown>;
            };
            const handler = this.requestsHandlers.get(parsed.method);
            if (!handler) {
                console.error('No handler for method', parsed.method);
                return;
            }
            const result = await handler(parsed.params, {
                webViewId: data.webViewId,
                webViewOrigin: data.webViewOrigin
            });
            await DappBrowserPlugin.sendToBrowser({
                webViewId: data.webViewId,
                queryId: data.queryId,
                payload: JSON.stringify(result)
            });
        });

        DappBrowserPlugin.addListener('browserUrlChanged', async data => {
            const updatedTab = {
                id: data.webViewId,
                url: data.url,
                title: data.title,
                iconUrl: data.iconUrl,
                canGoBack: data.canGoBack,
                isLive: true as const
            };
            this.tabChange.next(updatedTab);

            const tabToChange = this.liveTabs.findIndex(t => t.id === data.webViewId);
            if (tabToChange !== -1) {
                this.liveTabs[tabToChange] = updatedTab;
            }
        });

        DappBrowserPlugin.addListener('browserTabOpened', async data => {
            const updatedTab = {
                id: data.webViewId,
                url: data.url,
                title: data.title,
                iconUrl: data.iconUrl,
                isLive: true as const,
                canGoBack: false
            };
            this.tabChange.next(updatedTab);

            const tabToChange = this.liveTabs.findIndex(t => t.id === data.webViewId);
            if (tabToChange !== -1) {
                this.liveTabs[tabToChange] = updatedTab;
            } else {
                this.liveTabs.push(updatedTab);
            }
        });

        DappBrowserPlugin.setOffset({ top: 36, bottom: 98 });
    }

    async close(id: string | string[]): Promise<void> {
        const ids = Array.isArray(id) ? id : [id];
        await DappBrowserPlugin.close({ ids });
        this.liveTabs = this.liveTabs.filter(t => !ids.includes(t.id));
    }

    hide(id?: string): Promise<void> {
        return DappBrowserPlugin.hide({ id });
    }

    async open(
        url: string,
        options: {
            id?: string;
        }
    ): Promise<BrowserTabBase> {
        const id = options.id ?? Date.now().toString();
        const metadata = await DappBrowserPlugin.open({
            url,
            id
        });

        const openedTab = {
            id,
            title: metadata.title,
            iconUrl: metadata.iconUrl,
            url,
            isLive: true as const,
            canGoBack: false
        };

        this.liveTabs.push(openedTab);
        return openedTab;
    }

    emitEvent(webViewId: string, payload: string): Promise<void> {
        return DappBrowserPlugin.sendToBrowser({
            webViewId,
            payload
        });
    }

    setRequestsHandler(
        method: string,
        handler: (
            rpcParams: Record<string, unknown>,
            ctx: {
                webViewId: string;
                webViewOrigin: string;
            }
        ) => Promise<unknown>
    ): void {
        this.requestsHandlers.set(method, handler);
    }

    setIsMainViewInFocus(element: FocusableElement, focus: boolean): Promise<void> {
        if (focus) {
            return this.mainWindowFocusController.focusMainWindowForElement(element);
        } else {
            return this.mainWindowFocusController.unfocusMainWindowForElement(element);
        }
    }

    reload(selector: { id: string } | { ids: string[] } | { origin: string }): Promise<void> {
        let ids;
        if ('id' in selector) {
            ids = [selector.id];
        } else if ('ids' in selector) {
            ids = selector.ids;
        } else {
            ids = this.liveTabs
                .filter(t => eqOrigins(selector.origin, originFromUrl(t.url)))
                .map(t => t.id);
        }

        if (!ids.length) {
            return Promise.resolve();
        }

        return DappBrowserPlugin.reload({ ids });
    }

    goBack(id: string): Promise<void> {
        return DappBrowserPlugin.goBack({ id });
    }

    openedOriginIds(origin: string): string[] {
        return this.liveTabs.filter(t => eqOrigins(origin, originFromUrl(t.url))).map(t => t.id);
    }
}

const focusableElements = [
    'wallet-nav',
    'aside-nav',
    'tab-header-dd',
    'tc-connect',
    'tc-action'
] as const;
type FocusableElement = (typeof focusableElements)[number];
class MainWindowFocusController {
    focusedElements = new Set<FocusableElement>();

    constructor(private readonly setMainWindowFocus: (focus: boolean) => Promise<void>) {}

    async focusMainWindowForElement(element: FocusableElement): Promise<void> {
        this.focusedElements.add(element);

        return this.setMainWindowFocus(this.focusedElements.size > 0);
    }

    async unfocusMainWindowForElement(element: FocusableElement): Promise<void> {
        this.focusedElements.delete(element);

        return this.setMainWindowFocus(this.focusedElements.size > 0);
    }
}

export const CapacitorDappBrowser = new DappBrowser();
