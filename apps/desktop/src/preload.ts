// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';
import { Message } from './libs/message';

contextBridge.exposeInMainWorld('backgroundApi', {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
    message: (message: Message) => ipcRenderer.invoke('message', message),
    onTonConnect: (callback: Function) => ipcRenderer.on('tc', (_event, value) => callback(value))
});
