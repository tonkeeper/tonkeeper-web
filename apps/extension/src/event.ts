import browser from 'webextension-polyfill';
import { AskProcessor, NotificationData } from './libs/event';
import { replySubject } from '@tonkeeper/core/dist/entries/atom';

let port: browser.Runtime.Port;

export const extensionBackgroundEvents$ = replySubject<{
    type: 'showNotification';
    data: NotificationData;
}>();

export const sendBackground: AskProcessor<void> = {
    message: (method, params) => {
        port.postMessage({ method, params });
    }
};

export const connectToBackground = () => {
    port = browser.runtime.connect({ name: 'TonkeeperUI' });

    port.onMessage.addListener(data => {
        extensionBackgroundEvents$.next(data);
    });

    port.onDisconnect.addListener(() => {
        connectToBackground();
    });

    port.postMessage({ type: 'PopupConnected' });
};
