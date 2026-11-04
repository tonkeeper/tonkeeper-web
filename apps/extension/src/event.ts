import browser from 'webextension-polyfill';
import { AskProcessor, NotificationData } from './libs/event';
import { replaySubject } from '@tonkeeper/core/dist/entries/atom';

let port: browser.Runtime.Port;
let keepAliveInterval: ReturnType<typeof setInterval> | undefined;

export const extensionBackgroundEvents$ = replaySubject<{
    type: 'showNotification';
    data: NotificationData;
}>();

export const sendBackground: AskProcessor<void> = {
    message: (method, params) => {
        // The MV3 background worker may have suspended and dropped the port
        // since the last message; reconnecting wakes it, so retry once on a
        // dead port. Never throw upward — callers update UI state right
        // after sending, and a throw here would freeze the notification.
        try {
            port.postMessage({ method, params });
        } catch (e) {
            try {
                connectToBackground();
                port.postMessage({ method, params });
            } catch (retryError) {
                console.error('sendBackground: message lost after reconnect', retryError);
            }
        }
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

    // Port traffic resets the MV3 service-worker idle timer. Without the
    // ping the worker suspends after ~30s and drops the in-memory pending
    // dApp request (`awaitPopupResponse`), so an approval clicked after
    // that resolves nothing and the dApp hangs.
    clearInterval(keepAliveInterval);
    keepAliveInterval = setInterval(() => {
        try {
            port.postMessage({ type: 'ping' });
        } catch {
            // the onDisconnect listener re-establishes the port
        }
    }, 15000);
};
