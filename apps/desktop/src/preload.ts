// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';
import { Message } from './libs/message';
import { AccountConnection } from '@tonkeeper/core/dist/service/tonConnect/connectionService';
import { TonConnectAppRequestPayload } from '@tonkeeper/core/dist/entries/tonConnect';
import { atom, replaySubject } from '@tonkeeper/core/dist/entries/atom';

const tcRequests$ = atom<string>(undefined);
const tonConnectRequests$ = replaySubject<TonConnectAppRequestPayload>('all');
const tonConnectDisconnects$ = replaySubject<AccountConnection>('all');
const refreshes$ = replaySubject<void>('all');

ipcRenderer.on('tc', (_event, value) => tcRequests$.next(value));
ipcRenderer.on('tonConnectRequest', (_event, value: TonConnectAppRequestPayload) =>
    tonConnectRequests$.next(value)
);
ipcRenderer.on('disconnect', (_event, value: AccountConnection) =>
    tonConnectDisconnects$.next(value)
);
ipcRenderer.on('refresh', () => refreshes$.next());

contextBridge.exposeInMainWorld('backgroundApi', {
    platform: () => process.platform,
    arch: () => process.arch,
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
    message: (message: Message) => ipcRenderer.invoke('message', message),
    onTonConnect: (callback: (url: string) => void) => {
        tcRequests$.subscribe(callback);
        if (tcRequests$.value !== undefined) {
            callback(tcRequests$.value);
        }
    },
    onTonConnectRequest: (callback: (value: TonConnectAppRequestPayload) => void) => {
        tonConnectRequests$.subscribe(callback);
    },
    onTonConnectDisconnect: (callback: (value: AccountConnection) => void) => {
        tonConnectDisconnects$.subscribe(callback);
    },
    onRefresh: (callback: () => void) => {
        refreshes$.subscribe(callback);
    }
});
