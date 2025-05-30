import { Buffer as BufferPolyfill } from 'buffer';
import log from 'electron-log/main';
import { EventSource } from 'eventsource';
import { MainWindow } from './mainWindow';
import { mainStorage } from './storageService';
import { TonConnectSSE } from '@tonkeeper/core/dist/service/tonConnect/ton-connect-sse';

globalThis.Buffer = BufferPolyfill;
globalThis.EventSource = EventSource;

export const tonConnectSSE = new TonConnectSSE({
    storage: mainStorage,
    listeners: {
        onDisconnect: params => MainWindow.mainWindow.webContents.send('disconnect', params),
        onRequest: params => MainWindow.mainWindow.webContents.send('tonConnectRequest', params)
    },
    system: {
        log,
        refresh: () => MainWindow.mainWindow.webContents.send('refresh'),
        bringToFront: async () => {
            await MainWindow.bringToFront();
        }
    }
});
