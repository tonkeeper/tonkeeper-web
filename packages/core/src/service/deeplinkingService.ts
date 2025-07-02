import queryString from 'query-string';
import { seeIfValidTonAddress, seeIfValidTronAddress } from '../utils/common';
import { TON_CONNECT_MSG_VARIANTS_ID, TonConnectTransactionPayload } from '../entries/tonConnect';
import {
    Address,
    beginCell,
    Cell,
    comment,
    CommonMessageInfoRelaxedInternal,
    storeStateInit
} from '@ton/core';
import { DNSApi } from '../tonApiV2';
import { APIConfig } from '../entries/apis';
import { JettonEncoder } from './ton-blockchain/encoder/jetton-encoder';

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

// eslint-disable-next-line complexity
export async function parseTonTransaction(
    url: string,
    {
        api,
        walletAddress,
        batteryResponse,
        gaslessResponse
    }: {
        api: APIConfig;
        walletAddress: string;
        batteryResponse: string;
        gaslessResponse: string;
    }
): Promise<
    | {
          type: 'complex';
          params: TonConnectTransactionPayload;
      }
    | {
          type: 'simple';
          params: Omit<TonTransferParams, 'address'> & { address: string };
      }
    | null
> {
    try {
        const data = queryString.parseUrl(url);

        const paths = getUrlPaths(data.url);

        if (paths.length !== 2 || paths[0] !== 'transfer') {
            throw new Error('Unsupported link');
        }

        const addrParam = paths[1];
        if (typeof addrParam !== 'string') {
            throw new Error('Unsupported link: wrong address');
        }

        let to = undefined;
        if (seeIfValidTonAddress(addrParam)) {
            to = addrParam;
        } else {
            const result = await new DNSApi(api.tonApiV2).dnsResolve({ domainName: addrParam });
            if (result.wallet?.address && seeIfValidTonAddress(result.wallet?.address)) {
                to = result.wallet?.address;
            } else {
                throw new Error('Unsupported link: wrong dns');
            }
        }

        let value: string;
        if (data.query.amount && typeof data.query.amount === 'string') {
            if (isFinite(parseInt(data.query.amount))) {
                value = data.query.amount;
            } else {
                throw new Error('Unsupported link: no amount');
            }
        } else {
            return {
                type: 'simple',
                params: {
                    address: to,
                    text: typeof data.query.text === 'string' ? data.query.text : undefined,
                    jetton: typeof data.query.jetton === 'string' ? data.query.jetton : undefined
                }
            };
        }

        let validUntil = Math.ceil(Date.now() / 1000 + 5 * 60);
        if (
            data.query.exp &&
            typeof data.query.exp === 'string' &&
            isFinite(parseInt(data.query.exp))
        ) {
            validUntil = parseInt(data.query.exp);
            if (validUntil - 2000 < Date.now() / 1000) {
                throw new Error('Unsupported link: expired');
            }
        }

        let payload = undefined;
        if (data.query.bin && typeof data.query.bin === 'string') {
            payload = data.query.bin;
        }

        if (data.query.text && typeof data.query.text === 'string') {
            if (payload !== undefined) {
                throw new Error('Unsupported link: payload and text');
            }

            payload = comment(data.query.text).toBoc().toString('base64');
        }

        if (data.query.jetton && typeof data.query.jetton === 'string') {
            const jetton = data.query.jetton;
            if (!seeIfValidTonAddress(jetton)) {
                throw new Error('Unsupported link: wrong jetton address');
            }

            const params = {
                valid_until: validUntil,
                messages: await encodeJettonMessage(
                    { to, value, payload, jetton },
                    { api, walletAddress }
                ),
                messagesVariants: {
                    [TON_CONNECT_MSG_VARIANTS_ID.BATTERY]: {
                        messages: await encodeJettonMessage(
                            { to, value, payload, jetton, responseAddress: batteryResponse },
                            { api, walletAddress }
                        )
                    },
                    [TON_CONNECT_MSG_VARIANTS_ID.GASLESS]: {
                        messages: await encodeJettonMessage(
                            { to, value, payload, jetton, responseAddress: gaslessResponse },
                            { api, walletAddress }
                        ),
                        options: {
                            asset: jetton
                        }
                    }
                }
            } satisfies TonConnectTransactionPayload;
            return {
                type: 'complex',
                params
            };
        }

        let stateInit = undefined;
        if (data.query.init && typeof data.query.init === 'string') {
            stateInit = data.query.init;
        }

        const params = {
            valid_until: validUntil,
            messages: [
                {
                    address: to,
                    amount: value,
                    payload,
                    stateInit
                }
            ]
        } satisfies TonConnectTransactionPayload;
        return {
            type: 'complex',
            params
        };
    } catch (e) {
        console.error(e);
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

async function encodeJettonMessage(
    {
        to,
        value,
        payload,
        jetton,
        responseAddress
    }: { to: string; value: string; payload?: string; jetton: string; responseAddress?: string },
    {
        api,
        walletAddress
    }: {
        api: APIConfig;
        walletAddress: string;
    }
) {
    const je = new JettonEncoder(api, walletAddress);
    const jettonTransfer = await je.encodeTransfer({
        to,
        amount: {
            asset: {
                address: Address.parse(jetton)
            },
            stringWeiAmount: value
        },
        responseAddress,
        payload: payload
            ? {
                  type: 'raw',
                  value: Cell.fromBase64(payload)
              }
            : undefined
    });

    if (jettonTransfer.messages.length !== 1) {
        throw new Error('Unsupported link: wrong jetton encoding result');
    }

    const msg = jettonTransfer.messages[0];
    const info = msg.info as CommonMessageInfoRelaxedInternal;

    return [
        {
            address: info.dest.toRawString(),
            amount: info.value.coins.toString(),
            payload: msg.body.toBoc().toString('base64'),
            stateInit: msg.init
                ? beginCell().store(storeStateInit(msg.init)).endCell().toBoc().toString('base64')
                : undefined
        }
    ] satisfies TonConnectTransactionPayload['messages'];
}

const getUrlPaths = (url: string) => {
    const paths = url.split('/');

    const u = new URL(url);
    if (u.protocol === 'http:' || u.protocol === 'https:') {
        let sliced = paths.slice(3);

        /**
         * remove pro path prefix from the universal link
         */
        if (sliced[0] === 'pro') {
            sliced = sliced.slice(1);
        }

        return sliced;
    }

    return paths.slice(2);
};
