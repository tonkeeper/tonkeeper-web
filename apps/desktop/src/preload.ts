// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { SendTransactionAppRequest } from '@tonkeeper/uikit/dist/components/connect/connectHook';
import { contextBridge, ipcRenderer } from 'electron';
import { Message } from './libs/message';
import { AccountConnection } from '@tonkeeper/core/dist/service/tonConnect/connectionService';

contextBridge.exposeInMainWorld('backgroundApi', {
    platform: () => process.platform,
    arch: () => process.arch,
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
    message: (message: Message) => ipcRenderer.invoke('message', message),
    onTonConnect: (callback: (url: string) => void) =>
        ipcRenderer.on('tc', (_event, value) => callback(value)),
    onTonConnectTransaction: (callback: (value: SendTransactionAppRequest) => void) =>
        ipcRenderer.on('sendTransaction', (_event, value) => callback(value)),
    onTonConnectDisconnect: (callback: (value: AccountConnection) => void) =>
        ipcRenderer.on('disconnect', (_event, value) => callback(value)),
    onRefresh: (callback: () => void) => ipcRenderer.on('refresh', _event => callback())
});
