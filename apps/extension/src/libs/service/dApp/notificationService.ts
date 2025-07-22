/**
 * Service methods to manage notification PopUp
 * Origin: https://github.com/OpenProduct/openmask-extension/blob/main/src/libs/service/dApp/notificationService.ts
 */

import { backgroundEventsEmitter } from '../../event';
import ExtensionPlatform from '../extension';

const NOTIFICATION_HEIGHT = 650;
const NOTIFICATION_WIDTH = 380;

let popupId: number | undefined = undefined;

ExtensionPlatform.addOnRemovedListener(windowId => {
    if (windowId === popupId) {
        backgroundEventsEmitter.emit('closedPopUp', {
            method: 'closedPopUp',
            params: windowId
        });
        popupId = undefined;
    }
});

export const getActiveTabLogo = async () => {
    const [tab] = await ExtensionPlatform.getActiveTabs();
    return (tab && tab.favIconUrl) ?? '';
};

export const getPopup = async () => {
    const windows = await ExtensionPlatform.getAllWindows();
    return windows
        ? windows.find(win => {
              return win && win.type === 'popup' && win.id === popupId;
          })
        : null;
};

export const openPopUp = async (page: string) => {
    const popup = await getPopup();
    if (popup && popup.id) {
        return ExtensionPlatform.focusWindow(popup.id);
    } else {
        const lastFocused = await ExtensionPlatform.getLastFocusedWindow();
        // Position window in top right corner of lastFocused window.
        const top = lastFocused.top!;
        const left = lastFocused.left! + (lastFocused.width! - NOTIFICATION_WIDTH);

        // create new notification popup
        const popupWindow = await ExtensionPlatform.openWindow({
            url: `index.html#${page}`,
            type: 'popup',
            width: NOTIFICATION_WIDTH,
            height: NOTIFICATION_HEIGHT,
            left,
            top
        });

        popupId = popupWindow.id;
    }
};

export const closeCurrentPopUp = async (id: number | undefined) => {
    if (id) {
        try {
            await ExtensionPlatform.closeWindow(id);
        } catch (e) {
            console.error(e);
        }
    }
};

export const closeOpenedPopUp = async () => closeCurrentPopUp(popupId);

export const openNotificationPopUp = async () => {
    await openPopUp('/notification');
    return popupId;
};
