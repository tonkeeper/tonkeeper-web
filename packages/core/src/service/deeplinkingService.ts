import queryString from 'query-string';
import { seeIfValidTonAddress } from '../utils/common';

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
