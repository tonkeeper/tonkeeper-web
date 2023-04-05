import BigNumber from 'bignumber.js';
import { Address } from 'ton-core';

export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export function throttle<Args extends unknown[]>(
  fn: (...args: Args) => void,
  cooldown: number
) {
  let lastArgs: Args | undefined;

  const run = () => {
    if (lastArgs) {
      fn(...lastArgs);
      lastArgs = undefined;
    }
  };

  const throttled = (...args: Args) => {
    const isOnCooldown = !!lastArgs;

    lastArgs = args;

    if (isOnCooldown) {
      return;
    }

    window.setTimeout(run, cooldown);
  };

  return throttled;
}

export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  ms = 300
) {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: any, ...args: Args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
}

export const toShortAddress = (address: string, length = 4): string => {
  return toShortValue(Address.parse(address).toString(), length);
};

export const toShortValue = (value: string, length = 4): string => {
  return value.slice(0, length) + '...' + value.slice(-length);
};

export function formatTransferUrl(options: {
  address: string;
  amount?: string;
  text?: string;
  jetton?: string;
}) {
  let url = 'ton://transfer/' + Address.parse(options.address).toString();

  const params = [];

  if (options.amount) {
    params.push('amount=' + options.amount);
  }
  if (options.text) {
    params.push('text=' + encodeURIComponent(options.text));
  }
  if (options.jetton) {
    params.push('jetton=' + Address.parse(options.jetton).toString());
  }

  if (params.length === 0) return url;

  return url + '?' + params.join('&');
}

export const seeIfAddressEqual = (one?: string, two?: string) => {
  if (!one || !two) return false;
  return Address.parse(one).toRawString() === Address.parse(two).toRawString();
};

export const seeIfValidAddress = (value: string): boolean => {
  try {
    Address.parse(value);
    return true;
  } catch (e) {
    return false;
  }
};

export interface TonTransferParams {
  address: string;
  amount?: string;
  text?: string;
  jetton?: string;
}

const PREFIX = 'ton://transfer/';
export function parseTonTransfer(options: { url: string }) {
  try {
    if (seeIfValidAddress(options.url)) {
      const result: TonTransferParams = {
        address: options.url,
      };
      return result;
    }

    if (!options.url.startsWith(PREFIX)) {
      throw new Error('must starts with ' + PREFIX);
    }

    const arr = options.url.substring(PREFIX.length).split('?');
    if (arr.length > 2) {
      throw new Error('multiple "?"');
    }

    const address = arr[0];

    if (!seeIfValidAddress(address)) {
      throw new Error('invalid address format ' + address);
    }

    const result: TonTransferParams = {
      address,
    };
    const rest = arr[1];
    if (rest && rest.length) {
      const pairs = rest.split('&').map((s) => s.split('='));

      for (const pair of pairs) {
        if (pair.length !== 2) throw new Error('invalid url pair');
        const key = pair[0];
        const value = pair[1];

        if (key === 'amount') {
          if (result.amount) {
            throw new Error('amount already set');
          }
          const bn = new BigNumber(value);
          if (bn.isNegative()) {
            throw new Error('negative amount');
          }
          result.amount = value;
        } else if (key === 'text') {
          if (result.text) {
            throw new Error('text already set');
          }
          result.text = decodeURIComponent(value);
        } else if (key === 'jetton') {
          if (result.jetton) {
            throw new Error('text already set');
          }
          result.jetton = decodeURIComponent(value);
        } else {
          throw new Error('unknown url var ' + key);
        }
      }
    }

    return result;
  } catch (e) {
    return null;
  }
}
