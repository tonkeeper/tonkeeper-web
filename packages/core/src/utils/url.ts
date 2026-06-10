import { Address } from '@ton/core';

export const removeLastSlash = (url: string) => url.replace(/\/$/, '');

export function eqOrigins(origin1: string, origin2: string | undefined): boolean {
    return origin2 !== undefined && removeLastSlash(origin1) === removeLastSlash(origin2);
}

export function originFromUrl(url: string): string | undefined {
    try {
        const parsed = new URL(url);
        return removeLastSlash(parsed.origin);
    } catch (e) {
        console.error(e);
        return undefined;
    }
}

export function isLocalhost(url: string): boolean {
    const origin = originFromUrl(url);
    if (!origin) {
        return false;
    }

    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

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
