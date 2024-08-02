import { Address } from '@ton/core';
import { decodeBase58, sha256 } from 'ethers';
import { Network } from '../entries/network';
import { CryptoCurrency } from '../entries/crypto';

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function throttle<Args extends unknown[]>(fn: (...args: Args) => void, cooldown: number) {
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

export function debounce<Args extends unknown[]>(fn: (...args: Args) => void, ms = 300) {
    let timeoutId: ReturnType<typeof setTimeout>;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function debounced(this: any, ...args: Args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), ms);
    }

    debounced.clear = () => {
        clearTimeout(timeoutId);
    };

    return debounced;
}

export const areEqAddresses = (address1: string, address2: string) => {
    try {
        return Address.parse(address1).equals(Address.parse(address2));
    } catch {
        return false;
    }
};

export const isTonAddress = (address: string) => {
    return address.toLowerCase() === CryptoCurrency.TON.toLowerCase();
};

export const toShortValue = (value: string, length = 4): string => {
    if (value.length > length * 2) {
        return value.slice(0, length) + '…' + value.slice(-length);
    } else {
        return value;
    }
};

export const formatAddress = (value: string | Address, network?: Network, bounceable = false) => {
    return (typeof value === 'string' ? Address.parse(value) : value).toString({
        testOnly: network === Network.TESTNET,
        bounceable
    });
};

export function formatTransferUrl(options: {
    address: string;
    amount?: string;
    text?: string;
    jetton?: string;
}) {
    const url = 'ton://transfer/' + options.address;

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

export const seeIfValidTonAddress = (value: string): boolean => {
    try {
        if (value.includes('://')) {
            return false; // ignore links
        }
        Address.parse(value);
        return true;
    } catch (e) {
        return false;
    }
};

export const seeIfValidTronAddress = (address: string): boolean => {
    try {
        const decoded = decodeBase58(address).toString(16);
        if (decoded.length !== 50 || !decoded.startsWith('41')) {
            return false;
        }
        const payload = decoded.slice(0, 42);
        const tail = decoded.slice(42);
        const checkSumTail = sha256(sha256('0x' + payload)).slice(2, 10);
        return tail === checkSumTail;
    } catch (e) {
        return false;
    }
};
