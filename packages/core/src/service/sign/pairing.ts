import { Cell } from '@ton/core';

import { IAppSdk } from '../../AppSdk';
import { TonWalletStandard } from '../../entries/wallet';
import { KeystoneMessageType } from '../keystone/types';
import { LedgerTonProofRequest, LedgerTonProofResponse } from '../ledger/connector';

/**
 * Request/response bridges between core signing strategies and the
 * uikit-level UI that prompts the user (Signer QR, Keystone, Ledger).
 * Each call emits a `uiEvents` request keyed by a fresh `id`, then
 * resolves when a matching `response` arrives.
 */

export const pairSignerByNotification = async (
    sdk: IAppSdk,
    boc: string,
    wallet: TonWalletStandard
): Promise<string> => {
    const id = Date.now();
    return new Promise<string>((resolve, reject) => {
        sdk.uiEvents.emit('signer', {
            method: 'signer',
            id,
            params: { boc, wallet }
        });

        const onCallback = (message: {
            method: 'response';
            id?: number | undefined;
            params: string | Error;
        }) => {
            if (message.id === id) {
                const { params } = message;
                sdk.uiEvents.off('response', onCallback);

                if (typeof params === 'string') {
                    resolve(params);
                } else {
                    reject(params);
                }
            }
        };

        sdk.uiEvents.on('response', onCallback);
    });
};

export const pairKeystoneByNotification = async (
    sdk: IAppSdk,
    message: Buffer,
    messageType: KeystoneMessageType,
    pathInfo?: { path: string; mfp: string }
): Promise<string> => {
    const id = Date.now();
    return new Promise<string>((resolve, reject) => {
        sdk.uiEvents.emit('keystone', {
            method: 'keystone',
            id,
            params: {
                message,
                messageType,
                pathInfo
            }
        });

        const onCallback = (m: {
            method: 'response';
            id?: number | undefined;
            params: string | Error;
        }) => {
            if (m.id === id) {
                const { params } = m;
                sdk.uiEvents.off('response', onCallback);

                if (typeof params === 'string') {
                    resolve(params);
                } else {
                    reject(params);
                }
            }
        };

        sdk.uiEvents.on('response', onCallback);
    });
};

export const pairLedgerByNotification = async <T extends 'transaction' | 'ton-proof'>(
    sdk: IAppSdk,
    path: number[],
    request: T extends 'transaction'
        ? {
              transactions: import('../ledger/connector').LedgerTransaction[];
          }
        : {
              tonProof: LedgerTonProofRequest;
          }
): Promise<T extends 'transaction' ? Cell[] : LedgerTonProofResponse> => {
    const id = Date.now();
    return new Promise<T extends 'transaction' ? Cell[] : LedgerTonProofResponse>(
        (resolve, reject) => {
            sdk.uiEvents.emit('ledger', {
                method: 'ledger',
                id,
                params: { path, ...request }
            });

            const onCallback = (message: {
                method: 'response';
                id?: number | undefined;
                params: unknown;
            }) => {
                if (message.id === id) {
                    const { params } = message;
                    sdk.uiEvents.off('response', onCallback);

                    if (
                        params &&
                        typeof params === 'object' &&
                        ((Array.isArray(params) && params[0] instanceof Cell) ||
                            'signature' in params)
                    ) {
                        resolve(
                            params as T extends 'transaction' ? Cell[] : LedgerTonProofResponse
                        );
                    } else {
                        if (params instanceof Error) {
                            reject(params);
                        } else {
                            reject(new Error(params?.toString()));
                        }
                    }
                }
            };

            sdk.uiEvents.on('response', onCallback);
        }
    );
};
