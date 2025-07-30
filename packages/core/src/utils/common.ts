import { Address } from '@ton/core';
import { decodeBase58, sha256 } from 'ethers';
import { Network } from '../entries/network';
import { CryptoCurrency } from '../entries/crypto';
import BigNumber from 'bignumber.js';

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

export function bufferToBigInt(buffer: Buffer) {
    return BigInt(`0x${buffer.toString('hex')}`);
}

export const maxBigNumber = (a: BigNumber, b: BigNumber) => (a > b ? a : b);

export const isValidUrlProtocol = (url: string, authorizedOpenUrlProtocols: string[]) => {
    try {
        const u = new URL(url);
        return authorizedOpenUrlProtocols.includes(u.protocol);
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const safeWindowOpen = (url: string, allowedProtocols: string[]) => {
    try {
        if (!isValidUrlProtocol(url, allowedProtocols)) {
            throw new Error('Unsafe protocol');
        }

        return window.open(url, '_blank', 'noreferrer,noopener');
    } catch (e) {
        console.error(e);
    }
};

export function hideSensitiveData(message: string): string {
    const mnemonicRegexes = [
        // 24 words, separated by spaces, tabs or newlines
        {
            regex: /(^|\W)((?:\w+\s+){23}\w+)((?:\s*\n.*)?|$)/g,
            hasSuffix: true,
            priority: 1
        },
        // 12 words, separated by spaces, tabs or newlines
        {
            regex: /(^|\W)((?:\w+\s+){11}\w+)(?=\s|$|\W|\n)/g,
            hasSuffix: false,
            priority: 2
        },
        // 24 words, separated by commas
        {
            regex: /(^|\W)((?:"?\w+"?,\s*){23}(?:"?\w+"?))((?:,.*)?|$)/g,
            hasSuffix: true,
            priority: 1
        },
        // 12 words, separated by commas
        {
            regex: /(^|\W)((?:"?\w+"?,\s*){11}(?:"?\w+"?))(?=\s|$|\W|,)/g,
            hasSuffix: false,
            priority: 2
        }
    ];
    mnemonicRegexes.sort((a, b) => a.priority - b.priority);

    let result = message;
    mnemonicRegexes.forEach(({ regex, hasSuffix }) => {
        result = result.replace(regex, (_match, prefix, __mnemonic, suffix) => {
            return prefix + '##SensitiveData##' + (hasSuffix ? suffix || '' : '');
        });
    });

    return result;
}

export const pTimeout = <T>(p: Promise<T>, ms: number): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            reject(new Error('Timeout exceeded'));
        }, ms);

        p.then(result => {
            clearTimeout(timeoutId);
            resolve(result);
        }).catch(err => {
            clearTimeout(timeoutId);
            reject(err);
        });
    });
};
