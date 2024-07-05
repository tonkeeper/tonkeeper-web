/**
 * Service methods and subscription to handle DApp events
 * Origin: https://github.com/OpenProduct/openmask-extension/blob/main/src/libs/service/backgroundDAppService.ts
 *
 * @author: KuznetsovNikita
 * @since: 0.1.0
 */

import { TonConnectError } from '@tonkeeper/core/dist/entries/exception';
import { CONNECT_EVENT_ERROR_CODES } from '@tonkeeper/core/dist/entries/tonConnect';
import browser from 'webextension-polyfill';
import {
  DAppMessage,
  TonkeeperApiEvent,
  TonkeeperApiResponse,
} from '../../entries/message';
import { backgroundEventsEmitter } from '../event';
import {
  isDappConnectedToExtension,
  tonConnectDisconnect,
  tonConnectReConnect,
  tonConnectRequest,
  tonConnectTransaction
} from "./dApp/tonConnectService";

let contentScriptPorts = new Set<browser.Runtime.Port>();

const providerResponse = (
  id: number,
  method: string,
  result: undefined | unknown,
  error?: TonConnectError
): TonkeeperApiResponse => {
  return {
    type: 'TonkeeperAPI',
    message: {
      jsonrpc: '2.0',
      id,
      method,
      result,
      error: error
        ? {
            message: error.message,
            code: error.code,
          }
        : undefined,
    },
  };
};

const providerTonConnectEvent = (
  id: number,
  event: 'disconnect'
) => {
  return {
    type: 'TonkeeperAPI',
    message: {
      jsonrpc: '2.0',
      id,
      event: 'disconnect',
      payload: {}
    },
  };
};

const providerEvent = (
  method: 'accountsChanged' | 'chainChanged',
  result: undefined | unknown
): TonkeeperApiEvent => {
  return {
    type: 'TonkeeperAPI',
    message: {
      jsonrpc: '2.0',
      method,
      result,
    },
  };
};

export const handleDAppConnection = (port: browser.Runtime.Port) => {
  contentScriptPorts.add(port);
  port.onMessage.addListener(async (msg, contentPort) => {
    if (msg.type !== 'TonkeeperProvider' || !msg.message) {
      return;
    }

    const [result, error] = await handleDAppMessage(msg.message)
      .then((result) => [result, undefined] as const)
      .catch((e: TonConnectError) => [undefined, e] as const);

    if (contentPort) {
      contentPort.postMessage(
        providerResponse(msg.message.id, msg.message.method, result, error)
      );
    }
  });
  port.onDisconnect.addListener(async (port) => {
    if (port.sender?.url) {
      const dappIsConnected = await isDappConnectedToExtension(new URL(port.sender.url).origin);
      if (dappIsConnected) {
        return;
      }
    }
    contentScriptPorts.delete(port);
  });
};

const handleDAppMessage = async (message: DAppMessage): Promise<unknown> => {
  const origin = decodeURIComponent(message.origin);

  switch (message.method) {
    case 'ping': {
      return 'pong';
    }
    case 'tonConnect_connect': {
      return tonConnectRequest(message.id, origin, message.params[0]);
    }
    case 'tonConnect_reconnect': {
      return tonConnectReConnect(origin);
    }
    case 'tonConnect_disconnect': {
      return tonConnectDisconnect(message.id, origin);
    }
    case 'tonConnect_sendTransaction': {
      return tonConnectTransaction(
        message.id,
        origin,
        message.params[0],
        message.params[1]
      );
    }
    default:
      throw new TonConnectError(
        `Method "${message.method}" not implemented`,
        CONNECT_EVENT_ERROR_CODES.METHOD_NOT_SUPPORTED
      );
  }
};

export const subscriptionDAppNotifications = () => {
  backgroundEventsEmitter.on('chainChanged', (message) => {
    contentScriptPorts.forEach((port) => {
      port.postMessage(providerEvent('chainChanged', message.params));
    });
  });

  backgroundEventsEmitter.on('accountsChanged', async (message) => {
    contentScriptPorts.forEach((port) => {
      port.postMessage(providerEvent('accountsChanged', message.params));
    });
  });

  backgroundEventsEmitter.on('tonConnectDisconnect', async (message) => {
    const dappHosts = message.params.map(parap => new URL(parap).host);
    const ports = [...contentScriptPorts.values()].filter(p => p.sender?.url && dappHosts.includes(new URL(p.sender.url).host));

    if (ports.length) {
      ports.forEach(port => {
        try {
          port.postMessage(providerTonConnectEvent(Date.now(), 'disconnect'));
        } catch (e) { }
        contentScriptPorts.delete(port);
      })
    }
  });
};
