import { BaseApp } from '@tonkeeper/core/dist/AppSdk';
import copyToClipboard from 'copy-to-clipboard';
import browser from 'webextension-polyfill';
import packageJson from '../../package.json';
import { ExtensionStorage } from './storage';
import { checkForError } from './utils';
import { isValidUrlProtocol } from '@tonkeeper/core/dist/utils/common';
import { atom, mapAtom, ReadonlyAtom } from '@tonkeeper/core/dist/entries/atom';
import { AppRoute } from '@tonkeeper/uikit/dist/libs/routes';

export const extensionType: 'Chrome' | 'FireFox' | string | undefined =
    process.env.REACT_APP_EXTENSION_TYPE;

export class ExtensionAppSdk extends BaseApp {
    constructor() {
        super(new ExtensionStorage());
    }

    copyToClipboard = (value: string, notification?: string) => {
        copyToClipboard(value);
        this.topMessage(notification);
    };

    openPage = (url: string) => {
        return new Promise<void>((resolve, reject) => {
            if (!isValidUrlProtocol(url, this.authorizedOpenUrlProtocols)) {
                reject('Invalid url');
            }
            browser.tabs.create({ url }).then(_ => {
                const error = checkForError();
                if (error) {
                    return reject(error);
                }
                return resolve();
            });
        });
    };

    authorizedOpenUrlProtocols = ['http:', 'https:', 'tg:', 'mailto:'];

    disableScroll = () => null;

    enableScroll = () => null;

    getScrollbarWidth = () => 0;

    getKeyboardHeight = () => 0;

    isIOs = () => false;

    isStandalone = () => false;

    requestExtensionPermission = async () => {
        if (extensionType === 'FireFox') {
            await browser.permissions.request({ origins: ['<all_urls>'] });
        }
    };

    version = packageJson.version ?? 'Unknown';

    targetEnv = 'extension' as const;

    storeUrl = process.env.REACT_APP_STORE_URL;

    linksInterceptorAvailable = true;

    ledgerConnectionPage = LedgerConnectionPageManage.create();
}

class LedgerConnectionPageManage {
    private tabId = atom<number | undefined>(undefined);

    isOpened: ReadonlyAtom<boolean> = mapAtom(this.tabId, windowId => !!windowId);

    static create() {
        const hash = window.location.hash.slice(1).split('?')[0];
        if (hash !== AppRoute.connectLedger) {
            return new LedgerConnectionPageManage();
        }
        return undefined;
    }

    private constructor() {
        browser.tabs.onRemoved.addListener(this.handleTabClose);
    }

    private handleTabClose = async (closedTabId: number) => {
        if (closedTabId === this.tabId.value) {
            this.tabId.next(undefined);
            const popup = await browser.windows.getCurrent();
            await browser.windows.update(popup.id!, { focused: true });
        }
    };

    async open() {
        await this.close();
        const tab = await browser.tabs.create({
            url: `index.html#${AppRoute.connectLedger}`,
            active: true
        });

        this.tabId.next(tab.id);
        const tabWindow = await browser.windows.get(tab.windowId!);
        await browser.windows.update(tabWindow.id!, { focused: true });
    }

    async close() {
        try {
            if (this.tabId.value !== undefined) {
                await browser.tabs.remove(this.tabId.value);
                this.tabId.next(undefined);
            }
        } catch (e) {
            console.error(e);
        }
    }
}
