// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';
import { Message } from './libs/message';
import { AccountConnection } from '@tonkeeper/core/dist/service/tonConnect/connectionService';
import { TonConnectAppRequestPayload } from '@tonkeeper/core/dist/entries/tonConnect';
import { atom, replaySubject } from '@tonkeeper/core/dist/entries/atom';
import type { UpdateInfo } from './electron/updateCheck';

const tcRequests$ = atom<{ url: string; isColdStart: boolean }>(undefined);
const tonConnectRequests$ = replaySubject<TonConnectAppRequestPayload>('all');
const tonConnectDisconnects$ = replaySubject<AccountConnection>('all');
const refreshes$ = replaySubject<void>('all');
const updateAvailable$ = atom<UpdateInfo>(undefined);

ipcRenderer.on('tc', (_event, url: string, isColdStart?: boolean) =>
    tcRequests$.next({ url, isColdStart: isColdStart === true })
);
ipcRenderer.on('tonConnectRequest', (_event, value: TonConnectAppRequestPayload) =>
    tonConnectRequests$.next(value)
);
ipcRenderer.on('disconnect', (_event, value: AccountConnection) =>
    tonConnectDisconnects$.next(value)
);
ipcRenderer.on('refresh', () => refreshes$.next());
ipcRenderer.on('update-available', (_event, value: UpdateInfo) => updateAvailable$.next(value));

contextBridge.exposeInMainWorld('backgroundApi', {
    platform: () => process.platform,
    arch: () => process.arch,
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
    message: (message: Message) => ipcRenderer.invoke('message', message),
    onTonConnect: (callback: (url: string, isColdStart: boolean) => void) => {
        tcRequests$.subscribe(value => callback(value.url, value.isColdStart));
        if (tcRequests$.value !== undefined) {
            callback(tcRequests$.value.url, tcRequests$.value.isColdStart);
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
    },
    onUpdateAvailable: (callback: (value: UpdateInfo) => void): (() => void) => {
        const unsubscribe = updateAvailable$.subscribe(callback);
        if (updateAvailable$.value !== undefined) {
            callback(updateAvailable$.value);
        }
        return unsubscribe;
    }
});
