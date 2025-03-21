import { TonConnectSSE } from '@tonkeeper/core/dist/service/tonConnect/ton-connect-sse';
import { TabletStorage } from './storage';
import { AccountConnection } from '@tonkeeper/core/dist/service/tonConnect/connectionService';
import { TonConnectAppRequestPayload } from '@tonkeeper/core/dist/entries/tonConnect';
import { App } from '@capacitor/app';

export const tonConnectSSE = new TonConnectSSE({
    storage: new TabletStorage(),
    listeners: {
        onDisconnect: connection => {
            onDisconnectListeners.forEach(listener => listener(connection));
        },
        onRequest: params => {
            onTonConnectRequestListeners.forEach(listener => listener(params));
        }
    }
});

let onTonOrTonConnectUrlOpened: ((url: string) => void)[] = [];
let onDisconnectListeners: ((connection: AccountConnection) => void)[] = [];
let onTonConnectRequestListeners: ((value: TonConnectAppRequestPayload) => void)[] = [];

export const subscribeToTonConnectDisconnect = (
    listener: (connection: AccountConnection) => void
) => {
    onDisconnectListeners.push(listener);
    return () => {
        onDisconnectListeners = onDisconnectListeners.filter(l => l !== listener);
    };
};

export const subscribeToTonConnectRequestTransaction = (
    listener: (value: TonConnectAppRequestPayload) => void
) => {
    onTonConnectRequestListeners.push(listener);
    return () => {
        onTonConnectRequestListeners = onTonConnectRequestListeners.filter(l => l !== listener);
    };
};

export const subscribeToTonOrTonConnectUrlOpened = (listener: (url: string) => void) => {
    onTonOrTonConnectUrlOpened.push(listener);
    return () => {
        onTonOrTonConnectUrlOpened = onTonOrTonConnectUrlOpened.filter(l => l !== listener);
    };
};

App.addListener('appUrlOpen', ({ url }) => {
    if (url) {
        console.info('Received URL:', url);
        onTonOrTonConnectUrlOpened.forEach(listener => listener(url));
    }
});

App.addListener('appStateChange', async ({ isActive }) => {
    if (isActive) {
        tonConnectSSE.reconnect();
    } else {
        tonConnectSSE.destroy();
    }
});
