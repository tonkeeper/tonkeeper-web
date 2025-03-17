import queryString from 'query-string';
import { seeIfValidTonAddress, seeIfValidTronAddress } from '../utils/common';

export function seeIfBringToFrontLink(options: { url: string }) {
    const { query } = queryString.parseUrl(options.url);

    if (typeof query.ret === 'string' && query.v == null) {
        return { ret: query.ret };
    } else {
        return null;
    }
}

export interface TonTransferParams {
    address?: string;
    amount?: string;
    text?: string;
    jetton?: string;
}

export interface TronTransferParams {
    address?: string;
    amount?: string;
}

export function parseTonTransferWithAddress(options: { url: string }) {
    try {
        const data = queryString.parseUrl(options.url);

        const paths = data.url.split('/');

        let linkAddress: string;
        if (paths.length === 0) {
            throw new Error('Empty link');
        } else if (paths.length === 1 && seeIfValidTonAddress(options.url)) {
            linkAddress = paths[0];
        } else {
            const [operator, address] = paths.slice(-2);
            if (operator === 'transfer' && seeIfValidTonAddress(address)) {
                linkAddress = address;
            } else {
                throw new Error('unknown operator ' + data.url);
            }
        }

        if (data.query.bin) {
            throw new Error('Unsupported link');
        }

        const result: Omit<TonTransferParams, 'address'> & { address: string } = {
            address: linkAddress,
            ...data.query
        };

        return result;
    } catch (e) {
        return null;
    }
}

export function parseTronTransferWithAddress(options: { url: string }) {
    try {
        const data = queryString.parseUrl(options.url);

        let url = data.url;
        if (url.startsWith('tron:')) {
            url = url.slice(5);
        }

        if (!url) {
            throw new Error('Empty link');
        }

        if (!seeIfValidTronAddress(url)) {
            throw new Error('Unsupported link');
        }

        const address = url;
        const amount = typeof data.query.amount === 'string' ? parseFloat(data.query.amount) : NaN;

        if (isFinite(amount)) {
            return {
                address,
                amount
            };
        }

        return { address };
    } catch (e) {
        return null;
    }
}
