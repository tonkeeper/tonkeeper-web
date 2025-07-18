import memoryStore from '../store/memoryStore';
import { getActiveTabLogo, openNotificationPopUp } from './dApp/notificationService';
import { ExtensionStorage } from '../storage';
import { getGlobalPreferences } from '@tonkeeper/core/dist/service/globalPreferencesService';
import { waitApprove } from './dApp/utils';
import browser from 'webextension-polyfill';
import { isValidUrlProtocol } from '@tonkeeper/core/dist/utils/common';
import { cancelOpenedNotification } from './dApp/tonConnectService';

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

    await cancelOpenedNotification();
    const id = Date.now();
    memoryStore.addNotification({
        kind: 'tonLinkIntercept',
        id,
        logo: await getActiveTabLogo(),
        origin,
        data: { url }
    });

    try {
        const popupId = await openNotificationPopUp();
        await waitApprove<void>(id, popupId);
    } catch (e) {
        memoryStore.removeNotification(id);
        openWindowInNewTab(url);
    }
}
