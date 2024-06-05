import { EventEmitter } from '@tonkeeper/core/dist/entries/eventEmitter';
import { TonkeeperApiMessage } from '../entries/message';

const seeIsEvent = (method: string) => {
  switch (method) {
    case 'accountsChanged':
    case 'chainChanged':
      return true;
    default:
      return false;
  }
};

export class TonProvider extends EventEmitter {
  isTonkeeper = true;

  targetOrigin = '*';
  nextJsonRpcId = 0;
  promises: Record<
    string,
    {
      resolve: (value: unknown) => void;
      reject: (reason?: any) => void;
    }
  > = {};

  constructor(instance?: TonProvider) {
    super();

    if (instance) {
      this.nextJsonRpcId = instance.nextJsonRpcId;
      this.promises = instance.promises;
      this.callbacks = instance.callbacks;
      instance.destroyTonkeeper();
    }

    window.addEventListener('message', this.onMessage);
  }

  send<Result>(method: string, ...params: any[]) {
    if (!method || typeof method !== 'string') {
      return Promise.reject('Method is not a valid string.');
    }

    if (params.length === 1 && params[0] instanceof Array) {
      params = params[0];
    }

    const id = this.nextJsonRpcId++;
    const payload = {
      jsonrpc: '2.0',
      id,
      method,
      params,
      origin: window.origin,
    };

    const promise = new Promise((resolve, reject) => {
      this.promises[payload.id] = {
        resolve,
        reject,
      };
    });

    // Send jsonrpc request to OpenMask
    window.postMessage(
      {
        type: 'TonkeeperProvider',
        message: payload,
      },
      this.targetOrigin
    );

    return promise as Promise<Result>;
  }

  onMessage = async (event: any) => {
    // Return if no data to parse
    if (!event || !event.data) {
      return;
    }

    if (event.data.type !== 'TonkeeperAPI') return;

    const data: TonkeeperApiMessage = event.data;

    // Return if not a jsonrpc response
    if (!data || !data.message || !data.message.jsonrpc) {
      return;
    }

    const message = data.message;

    if ('event' in message) {
      this.emit(`tonConnect_event`, { event: message.event, payload: message.payload, id: message.id });
      return;
    }

    const { id, method, error, result } = message;

    if (typeof id !== 'undefined') {
      const promise = this.promises[id];
      if (promise) {
        if (message.error) {
          promise.reject(error);
        } else {
          promise.resolve(result);
        }
        delete this.promises[id];
      }
    } else {
      if (method && seeIsEvent(method)) {
        this.emit(method, result);
      }
    }
  };

  destroyTonkeeper() {
    window.removeEventListener('message', this.onMessage);
  }
}
