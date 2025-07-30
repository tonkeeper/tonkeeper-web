import { ExtensionStorage } from '../storage';
import { getGlobalPreferences } from '@tonkeeper/core/dist/service/globalPreferencesService';
import { awaitPopupResponse } from './dApp/utils';
import browser from 'webextension-polyfill';
import { isValidUrlProtocol } from '@tonkeeper/core/dist/utils/common';
import { popupManager } from '../background/popup-manager';
import ExtensionPlatform from './extension';
import { showNotificationInPopup } from './backgroundPopUpService';

const storage = new ExtensionStorage();

const openWindowInNewTab = (url: string) => {
    if (!isValidUrlProtocol(url, ['http:', 'https:', 'ton:'])) {
        throw new Error('Unsafe protocol');
    }
    browser.tabs.create({ url });
};

export async function processInterceptTonLink(origin: string, url: string) {
    const globalPreferences = await getGlobalPreferences(storage);
    if (globalPreferences.interceptTonLinks === 'never') {
        openWindowInNewTab(url);
        return;
    }

    const id = Date.now();

    const closedPopupHandle = await popupManager.openPopup();
    try {
        showNotificationInPopup({
            kind: 'tonLinkIntercept',
            id,
            logo: await ExtensionPlatform.getActiveTabLogo(),
            origin,
            data: { url }
        });
        await awaitPopupResponse<void>(id);
    } catch (e) {
        openWindowInNewTab(url);
        await closedPopupHandle?.();
    }
}
