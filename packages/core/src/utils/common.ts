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
    const result = Address.parse(value);
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

export function parseTonTransfer(options: { url: string }) {
  try {
    const url = new URL(options.url);
    if (url.protocol !== 'ton:') {
      return null;
    }
    const [, , operation, address] = url.pathname.split('/');
    if (operation !== 'transfer' || !seeIfValidAddress(address)) {
      return null;
    }

    const result: TonTransferParams = {
      address,
    };
    url.searchParams.forEach((value, key) =>
      Object.assign(result, { [key]: value })
    );

    return result;
  } catch (e) {
    return null;
  }
}
