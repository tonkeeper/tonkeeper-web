/**
 * Service methods and subscription to handle PopUp events
 * Origin: https://github.com/OpenProduct/openmask-extension/blob/main/src/libs/service/backgroundPopUpService.ts
 */

import browser from 'webextension-polyfill';
import { backgroundEventsEmitter, NotificationData, popUpEventEmitter } from '../event';
import { UserIdentityService } from '@tonkeeper/core/dist/user-identity';
import { ExtensionStorage } from '../storage';
import { AptabaseBackground } from '../aptabase-background';

type PopUpEventName = Parameters<typeof popUpEventEmitter.emit>[0];
type PopUpEventMessage = Parameters<typeof popUpEventEmitter.emit>[1];

let popUpPort: browser.Runtime.Port;
const portMessagesQueue: unknown[] = [];
export const handlePopUpConnection = (port: browser.Runtime.Port) => {
    popUpPort = port;

    port.onMessage.addListener(message => {
        if (message.type === 'PopupConnected') {
            popUpPort = port;
            portMessagesQueue.forEach(msg => popUpPort.postMessage(msg));
        } else {
            popUpEventEmitter.emit(message.method as PopUpEventName, message as PopUpEventMessage);
        }
    });

    port.onDisconnect.addListener(() => {
        popUpPort = null!;
    });
};

export function postMessageToPopup(data: unknown) {
    if (popUpPort) {
        popUpPort.postMessage(data);
    } else {
        portMessagesQueue.push(data);
    }
}

export function showNotificationInPopup(data: NotificationData) {
    postMessageToPopup({ type: 'showNotification', data });
}

// Just Proxy messages to background service
popUpEventEmitter.on('approveRequest', message => {
    backgroundEventsEmitter.emit('approveRequest', message);
});

popUpEventEmitter.on('rejectRequest', message => {
    backgroundEventsEmitter.emit('rejectRequest', message);
});

popUpEventEmitter.on('tonConnectDisconnect', message => {
    backgroundEventsEmitter.emit('tonConnectDisconnect', message);
});

popUpEventEmitter.on('proxyChanged', message => {
    backgroundEventsEmitter.emit('proxyChanged', message);
});

// End of proxy messages

let aptabase: AptabaseBackground;
const userIdentity = new UserIdentityService(new ExtensionStorage());

popUpEventEmitter.on('userProperties', message => {
    const { aptabaseEndpoint, aptabaseKey, ...restParams } = message.params;
    aptabase = new AptabaseBackground({
        host: aptabaseEndpoint,
        key: aptabaseKey,
        appVersion: browser.runtime.getManifest().version,
        userIdentity
    });

    aptabase.init(restParams);
});

popUpEventEmitter.on('trackEvent', message => {
    aptabase
        ?.track(message.params.name, message.params.params)
        .catch(e => console.warn('Failed to send Aptabase event', e));
});
