/**
 * The background service worker - a script with run inside browser
 * The service is responsible to manage input and output events or requests from DApps and PopUp
 */

import browser from 'webextension-polyfill';
import {
    handleDAppConnection,
    subscriptionDAppNotifications
} from './libs/service/backgroundDAppService';
import { handlePopUpConnection } from './libs/service/backgroundPopUpService';
import { subscriptionProxyNotifications } from './libs/service/backgroundProxyService';
import { customPopupManager } from './libs/background/custom-popup-manager';

async function getShouldOpenSystemPopup() {
    try {
        const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

        let win;
        if (tab && tab.windowId !== undefined) {
            win = await browser.windows.get(tab.windowId);
        } else {
            win = await browser.windows.getLastFocused();
        }

        const os = (await browser.runtime.getPlatformInfo()).os;

        // macOS and linux browsers provide ugly behavior of custom popup when browser is opened in fullscreen mode.
        // for these cases we open default popup
        return win?.state === 'fullscreen' && os !== 'win';
    } catch {
        return false;
    }
}

browser.runtime.onMessage.addListener(async msg => {
    if (msg?.type === 'DECIDE_MODE') {
        const openCustomPopup = !(await getShouldOpenSystemPopup());
        if (openCustomPopup) {
            customPopupManager.openPopup('icon-click');

            // default popup will receive this and execute window.close inside to close itself
            return { willOpenCustomPopup: true };
        } else {
            // default popup is already opened, we just need to close custom popup instances if any
            await customPopupManager.closePopupOpenedByOpener('icon-click');

            // default popup will receive this and proceed to render app inside
            return { willOpenCustomPopup: false };
        }
    }
});

browser.runtime.onConnect.addListener(port => {
    if (port.name === 'TonkeeperUI') {
        /**
         * Subscribing to events from PopUp UI
         * The background script is a kind of backend with responsible
         * to processing requests and store secure data in memory store.
         */
        handlePopUpConnection(port);
    }

    if (port.name === 'TonkeeperContentScript') {
        /**
         * Subscribing to events from dApps
         * The background is responsible to be as a service or middleware,
         * it could completely handle request or open notification modal to user confirmations.
         */
        handleDAppConnection(port);
    }
});

/**
 * Subscribing to update events and send it to dApps
 */
subscriptionDAppNotifications();

/**
 * Set-up browser proxy and subscription to change events;
 */
subscriptionProxyNotifications();
