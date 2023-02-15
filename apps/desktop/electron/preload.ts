import { contextBridge, ipcRenderer } from 'electron';
import { Message } from '../src/libs/message';

contextBridge.exposeInMainWorld('backgroundApi', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  message: (message: Message) => ipcRenderer.invoke('message', message),
});
