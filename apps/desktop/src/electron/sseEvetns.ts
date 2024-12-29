import { Buffer as BufferPolyfill } from 'buffer';
import log from 'electron-log/main';
import EventSourcePolyfill from 'eventsource';
import { MainWindow } from './mainWindow';
import { mainStorage } from './storageService';
import { TonConnectSSE } from '@tonkeeper/core/dist/service/tonConnect/ton-connect-sse';

globalThis.Buffer = BufferPolyfill;

export const tonConnectSSE = new TonConnectSSE({
    storage: mainStorage,
    listeners: {
        onDisconnect: connection =>
            MainWindow.mainWindow.webContents.send('disconnect', connection),
        onSendTransaction: params =>
            MainWindow.mainWindow.webContents.send('sendTransaction', params)
    },
    system: {
        log,
        refresh: () => MainWindow.mainWindow.webContents.send('refresh'),
        bringToFront: async () => {
            await MainWindow.bringToFront();
        }
    },
    EventSourcePolyfill: EventSourcePolyfill
});
