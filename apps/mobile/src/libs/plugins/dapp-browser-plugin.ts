import { registerPlugin } from '@capacitor/core';

export interface DappBrowserPlugin {
    open(params: { id: string; url: string; topOffset?: number }): Promise<void>;
    hide(params: { id: string }): Promise<void>;
    show(params: { id: string }): Promise<void>;
    close(params: { id: string }): Promise<void>;
}

export const DappBrowser = registerPlugin<DappBrowserPlugin>('DappBrowser', {
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
