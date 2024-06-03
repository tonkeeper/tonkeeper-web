/**
 * Service methods and subscription to handle PopUp events
 * Origin: https://github.com/OpenProduct/openmask-extension/blob/main/src/libs/service/backgroundPopUpService.ts
 *
 * @author: KuznetsovNikita
 * @since: 0.1.0
 */

import browser from 'webextension-polyfill';
import { BackgroundEvents, backgroundEventsEmitter, popUpEventEmitter, RESPONSE } from '../event';
import memoryStore from '../store/memoryStore';
import { AptabaseExtensionService } from './bachgroundAptabaseService';
import { closeCurrentPopUp, getPopup } from './dApp/notificationService';

let popUpPort: browser.Runtime.Port;

export const handlePopUpConnection = (port: browser.Runtime.Port) => {
    popUpPort = port;

    port.onMessage.addListener(message => {
        popUpEventEmitter.emit<any>(message.method, message);
    });

    port.onDisconnect.addListener(() => {
        popUpPort = null!;
    });
};

export const sendMessageToPopUp = <Payload>(
    method: keyof BackgroundEvents | typeof RESPONSE,
    id?: number,
    params?: Payload
) => {
    const message = {
        method,
        id,
        params
    };
    popUpPort.postMessage(message);
};

export const sendResponseToPopUp = <Payload>(id?: number, params?: Payload) => {
    sendMessageToPopUp(RESPONSE, id, params);
};

popUpEventEmitter.on('getNotification', message => {
    sendResponseToPopUp(message.id, memoryStore.getNotification());
});

popUpEventEmitter.on('chainChanged', message => {
    backgroundEventsEmitter.emit('chainChanged', message);
});

popUpEventEmitter.on('closePopUp', async message => {
    try {
        const popup = await getPopup();
        await closeCurrentPopUp((popup && popup.id) || undefined);
    } catch (e) {}
});

// Just Proxy messages to background service
popUpEventEmitter.on('approveRequest', message => {
    backgroundEventsEmitter.emit('approveRequest', message);
});

popUpEventEmitter.on('rejectRequest', message => {
    backgroundEventsEmitter.emit('rejectRequest', message);
});

popUpEventEmitter.on('accountsChanged', message => {
    backgroundEventsEmitter.emit('accountsChanged', message);
});

popUpEventEmitter.on('tonConnectDisconnect', message => {
    backgroundEventsEmitter.emit('tonConnectDisconnect', message);
});


popUpEventEmitter.on('proxyChanged', message => {
    backgroundEventsEmitter.emit('proxyChanged', message);
});

// End of proxy messages

const aptabase = new AptabaseExtensionService();

popUpEventEmitter.on('userProperties', message => {
    aptabase.init(message.params);
});

popUpEventEmitter.on('locations', message => {
    aptabase.pageView(message.params);
});

popUpEventEmitter.on('trackEvent', message => {
    aptabase.track(message.params.name, message.params.params);
});
