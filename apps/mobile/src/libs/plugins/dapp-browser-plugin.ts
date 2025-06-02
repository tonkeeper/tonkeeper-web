import { PluginListenerHandle, registerPlugin } from '@capacitor/core';
import { IDappBrowser } from '@tonkeeper/core/dist/AppSdk';

interface IDappBrowserPlugin {
    open(params: { id: string; url: string; topOffset?: number }): Promise<void>;
    hide(params: { id: string }): Promise<void>;
    show(params: { id: string }): Promise<void>;
    close(params: { id: string }): Promise<void>;
    addListener(
        eventName: 'browserMessageReceived',
        listenerFunc: (data: {
            webViewId: string;
            queryId: string;
            payload: string;
            webViewOrigin: string;
        }) => void
    ): Promise<PluginListenerHandle>;
    sendToBrowser(params: { webViewId: string; queryId?: string; payload: string }): Promise<void>;
}

const DappBrowserPlugin = registerPlugin<IDappBrowserPlugin>('DappBrowser', {
    web: () => {
        return {
            async open() {
                throw new Error('DappBrowser is not supported on web.');
            },
            async hide() {
                throw new Error('DappBrowser is not supported on web.');
            },
            async show() {
                throw new Error('DappBrowser is not supported on web.');
            },
            async close() {
                throw new Error('DappBrowser is not supported on web.');
            }
        };
    }
});

class DappBrowser implements IDappBrowser {
    private requestsHandlers = new Map<
        string,
        (
            payload: unknown,
            ctx: {
                webViewId: string;
                webViewOrigin: string;
            }
        ) => Promise<unknown>
    >();

    constructor() {
        DappBrowserPlugin.addListener('browserMessageReceived', async data => {
            const parsed = JSON.parse(data.payload);
            const handler = this.requestsHandlers.get(parsed.method);
            if (!handler) {
                console.error('No handler for method', parsed.method);
                return;
            }
            const result = await handler(parsed.payload, {
                webViewId: data.webViewId,
                webViewOrigin: data.webViewOrigin
            });
            await DappBrowserPlugin.sendToBrowser({
                webViewId: data.webViewId,
                queryId: data.queryId,
                payload: JSON.stringify(result)
            });
        });
    }

    close(id: string): Promise<void> {
        return DappBrowserPlugin.close({ id });
    }

    hide(id: string): Promise<void> {
        return DappBrowserPlugin.hide({ id });
    }

    async open(url: string): Promise<string> {
        const id = Date.now().toString();
        await DappBrowserPlugin.open({ url, id, topOffset: 100 });
        return id;
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
            payload: unknown,
            ctx: {
                webViewId: string;
                webViewOrigin: string;
            }
        ) => Promise<unknown>
    ): void {
        this.requestsHandlers.set(method, handler);
    }
}

export const CapacitorDappBrowser = new DappBrowser();
