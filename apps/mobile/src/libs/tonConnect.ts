import { TonConnectSSE } from "@tonkeeper/core/dist/service/tonConnect/ton-connect-sse";
import { CapacitorStorage } from "./storage";
import { AccountConnection } from "@tonkeeper/core/dist/service/tonConnect/connectionService";
import { SendTransactionAppRequest } from "@tonkeeper/core/dist/entries/tonConnect";
import { App } from "@capacitor/app";

export const tonConnectSSE = new TonConnectSSE({
  storage: new CapacitorStorage(),
  listeners: {
    onDisconnect: connection => {
      onDisconnectListeners.forEach(listener => listener(connection));
    },
    onSendTransaction: params => {
      onSendTransactionListeners.forEach(listener => listener(params));
    }
  }
});

let onTonOrTonConnectUrlOpened: ((url: string) => void)[] = [];
let onDisconnectListeners: ((connection: AccountConnection) => void)[] = [];
let onSendTransactionListeners: ((value: SendTransactionAppRequest) => void)[] = [];

export const subscribeToTonConnectDisconnect = (listener: (connection: AccountConnection) => void) => {
  onDisconnectListeners.push(listener);
  return () => {
    onDisconnectListeners = onDisconnectListeners.filter(l => l !== listener);
  }
};

export const subscribeToTonConnectSendTransaction = (listener: (value: SendTransactionAppRequest) => void) => {
  onSendTransactionListeners.push(listener);
  return () => {
    onSendTransactionListeners = onSendTransactionListeners.filter(l => l !== listener);
  }
};

export const subscribeToTonOrTonConnectUrlOpened = (listener: (url: string) => void) => {
  onTonOrTonConnectUrlOpened.push(listener);
  return () => {
    onTonOrTonConnectUrlOpened = onTonOrTonConnectUrlOpened.filter(l => l !== listener);
  }
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
