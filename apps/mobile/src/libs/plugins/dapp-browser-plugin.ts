import { PluginListenerHandle, registerPlugin } from '@capacitor/core';
import { IDappBrowser } from '@tonkeeper/core/dist/AppSdk';
import { BrowserTabBase } from '@tonkeeper/core/dist/service/dappBrowserService';
import { subject } from '@tonkeeper/core/dist/entries/atom';

interface DocumentMetadata {
    title: string;
    iconUrl: string;
}

interface IDappBrowserPlugin {
    open(params: {
        id: string;
        url: string;
        topOffset?: number;
        bottomOffset?: number;
    }): Promise<DocumentMetadata>;
    hide(params: { id: string }): Promise<void>;
    show(params: { id: string }): Promise<void>;
    close(params: { id: string }): Promise<void>;
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
                    title: 'Example tab',
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

    tabChange = subject<BrowserTabBase>();

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
            this.tabChange.next({
                id: data.webViewId,
                url: data.url,
                title: data.title,
                iconUrl: data.iconUrl
            });
        });
    }

    close(id: string): Promise<void> {
        return DappBrowserPlugin.close({ id });
    }

    hide(id: string): Promise<void> {
        return DappBrowserPlugin.hide({ id });
    }

    async open(url: string, id?: string): Promise<BrowserTabBase> {
        id ??= Date.now().toString();
        const metadata = await DappBrowserPlugin.open({
            url,
            id,
            topOffset: 52,
            bottomOffset: 98
        });

        return {
            id,
            title: metadata.title,
            iconUrl: metadata.iconUrl,
            url
        };
    }

    show(id: string): Promise<void> {
        return DappBrowserPlugin.show({ id });
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

    setIsMainViewInFocus(focus: boolean): Promise<void> {
        return DappBrowserPlugin.setIsMainViewInFocus({ focus });
    }
}

export const CapacitorDappBrowser = new DappBrowser();
