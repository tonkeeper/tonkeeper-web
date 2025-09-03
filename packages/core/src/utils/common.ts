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

export const maxOneCall = <A extends unknown[], R>(fn: (...args: A) => R): ((...args: A) => R) => {
    let called = false;

    return (...args: A): R => {
        if (called) {
            throw new Error('Function was already invoked');
        }

        called = true;

        return fn(...args);
    };
};

type MultiTapOptions = {
    intervalMs?: number;
    requiredCount?: number;
    resetAfterTrigger?: boolean;
};

export function createMultiTap(callback: () => void, config: MultiTapOptions = {}) {
    const { requiredCount = 5, intervalMs = 500, resetAfterTrigger = true } = config;

    let tapsCount = 0;
    let lastTapTime = 0;

    return function trigger() {
        const now = Date.now();

        if (now - lastTapTime <= intervalMs) {
            tapsCount += 1;
        } else {
            tapsCount = 1;
        }

        lastTapTime = now;

        if (tapsCount >= requiredCount) {
            callback();

            if (resetAfterTrigger) {
                tapsCount = 0;
                lastTapTime = 0;
            }
        }
    };
}

export function cachedAsync<TArgs extends unknown[], TResult>(
    ttlMs: number,
    handler: (...args: TArgs) => Promise<TResult>
) {
    type Entry = { promise: Promise<TResult>; createdAt: number; key: string };

    let entry: Entry | null = null;

    const isExpired = (e: Entry | null, keyNow: string) =>
        !e ||
        e.key !== keyNow ||
        ttlMs === 0 ||
        (ttlMs !== Infinity && Date.now() - e.createdAt >= ttlMs);

    return (...args: TArgs): Promise<TResult> => {
        const keyNow = toCacheKey(args);

        if (isExpired(entry, keyNow)) {
            const createdAt = Date.now();
            const p = handler(...args);
            entry = { promise: p, createdAt, key: keyNow };

            p.catch(() => {
                if (entry?.promise === p) {
                    entry = null;
                }
            });

            return p;
        }

        return entry!.promise;
    };
}

export function cachedSync<TArgs extends unknown[], TResult>(
    ttlMs: number,
    handler: (...args: TArgs) => TResult
) {
    type Entry = { value: TResult; createdAt: number; key: string };
    let entry: Entry | null = null;

    const isExpired = (e: Entry | null, keyNow: string) =>
        !e || e.key !== keyNow || (ttlMs !== Infinity && Date.now() - e.createdAt >= ttlMs);

    return (...args: TArgs): TResult => {
        const keyNow = toCacheKey(args);

        if (isExpired(entry, keyNow)) {
            const createdAt = Date.now();
            const result = handler(...args);
            entry = { value: result, createdAt, key: keyNow };
            return result;
        }

        return entry!.value;
    };
}

function toCacheKey(value: unknown): string {
    const result = JSON.stringify(value, stableReplacer);
    if (result.length > 2048) {
        return fnv1a32(result);
    }
    return result;
}

function stableReplacer(_: string, value: unknown): unknown {
    if (value === null || typeof value !== 'object') return value;

    const cmpKey = (a: unknown, b: unknown): number => {
        const sa = typeof a === 'string' ? a : JSON.stringify(a);
        const sb = typeof b === 'string' ? b : JSON.stringify(b);
        return sa < sb ? -1 : sa > sb ? 1 : 0;
    };

    if (value instanceof Date) {
        return { __t: 'Date', v: value.toISOString() };
    }
    if (value instanceof RegExp) {
        return { __t: 'RegExp', s: value.source, f: value.flags };
    }
    if (value instanceof Map) {
        return { __t: 'Map', v: Array.from(value.entries()).sort(([a], [b]) => cmpKey(a, b)) };
    }
    if (value instanceof Set) {
        return { __t: 'Set', v: Array.from(value.values()).sort(cmpKey) };
    }

    if (Array.isArray(value)) return value;

    // sort keys
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(value).sort()) {
        out[k] = (value as Record<string, unknown>)[k];
    }
    return out;
}

// Fast sync FNV-1a 32-bit → hex
function fnv1a32(str: string): string {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return h.toString(16).padStart(8, '0');
}

export function withRetry<TArgs extends unknown[], TResult>(
    handler: (...args: TArgs) => Promise<TResult>,
    options: {
        maxRetries: number;
        shouldRetry?: (error: unknown, attempt: number) => boolean | Promise<boolean>;
        delayMs?: number;
    }
): (...args: TArgs) => Promise<TResult> {
    return async (...args: TArgs): Promise<TResult> => {
        let attempt = 0;
        let lastError: unknown;

        while (attempt <= options.maxRetries) {
            try {
                return await handler(...args);
            } catch (err) {
                lastError = err;
                const should = !options.shouldRetry || (await options.shouldRetry(err, attempt));
                if (!should || attempt === options.maxRetries) {
                    throw err;
                }
                if (options.delayMs) {
                    await delay(options.delayMs);
                }
            }
            attempt++;
        }

        throw lastError;
    };
}
