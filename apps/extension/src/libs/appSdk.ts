import { BaseApp } from '@tonkeeper/core/dist/AppSdk';
import copyToClipboard from 'copy-to-clipboard';
import browser from 'webextension-polyfill';
import packageJson from '../../package.json';
import { ExtensionStorage } from './storage';
import { checkForError } from './utils';

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
            browser.tabs.create({ url }).then(newTab => {
                const error = checkForError();
                if (error) {
                    return reject(error);
                }
                return resolve();
            });
        });
    };

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

    static openTab(options: browser.Tabs.CreateCreatePropertiesType) {
        return new Promise((resolve, reject) => {
            browser.tabs.create(options).then(newTab => {
                const error = checkForError();
                if (error) {
                    return reject(error);
                }
                return resolve(newTab);
            });
        });
    }

    closeExtensionInBrowser = () => {
        window.close();
    };

    openExtensionInBrowser = async (
        route: string | null = null,
        queryString: string | null = null
    ) => {
        let extensionURL = browser.runtime.getURL('index.html');

        if (route) {
            extensionURL += `#${route}`;
        }

        if (queryString) {
            extensionURL += `${queryString}`;
        }

        await ExtensionAppSdk.openTab({ url: extensionURL });

        window.close();
    };

    version = packageJson.version ?? 'Unknown';

    targetEnv= 'extension' as const;
}
