import { Cell } from '@ton/core';
import { mnemonicToPrivateKey, sha256_sync, sign } from '@ton/crypto';
import { IAppSdk } from '@tonkeeper/core/dist/AppSdk';
import { AuthPassword } from '@tonkeeper/core/dist/entries/password';
import { CellSigner, Signer } from '@tonkeeper/core/dist/entries/signer';
import { KeystoneMessageType } from '@tonkeeper/core/dist/service/keystone/types';
import { LedgerTransaction } from '@tonkeeper/core/dist/service/ledger/connector';
import { decryptWalletMnemonic } from '@tonkeeper/core/dist/service/mnemonicService';
import {
    parseSignerSignature,
    storeTransactionAndCreateDeepLink
} from '@tonkeeper/core/dist/service/signerService';
import { delay } from '@tonkeeper/core/dist/utils/common';
import nacl from 'tweetnacl';
import { TxConfirmationCustomError } from '../libs/errors/TxConfirmationCustomError';
import { accountsStorage } from '@tonkeeper/core/dist/service/accountsStorage';
import { assertUnreachable } from '@tonkeeper/core/dist/utils/types';
import { AccountId } from '@tonkeeper/core/dist/entries/account';

export const signTonConnectOver = (
    sdk: IAppSdk,
    accountId: AccountId,
    t: (text: string) => string,
    checkTouchId: () => Promise<void>
) => {
    return async (bufferToSign: Buffer) => {
        const account = await accountsStorage(sdk.storage).getAccount(accountId);

        if (!account) {
            throw new Error("Can't use tonconnect over non standard ton wallet");
        }

        switch (account.type) {
            case 'ton-only': {
                throw new TxConfirmationCustomError(
                    'Signer linked by QR is not support sign buffer.'
                );
            }
            case 'ledger': {
                throw new TxConfirmationCustomError(t('ledger_operation_not_supported'));
            }
            case 'keystone': {
                const result = await pairKeystoneByNotification(
                    sdk,
                    bufferToSign,
                    'signProof',
                    account.pathInfo
                );
                return Buffer.from(result, 'hex');
            }
            default: {
                const mnemonic = await getMnemonic(sdk, accountId, checkTouchId);
                const keyPair = await mnemonicToPrivateKey(mnemonic);
                const signature = nacl.sign.detached(
                    Buffer.from(sha256_sync(bufferToSign)),
                    keyPair.secretKey
                );
                return signature;
            }
        }
    };
};

export const signTonConnectMnemonicOver = (mnemonic: string[]) => {
    return async (bufferToSign: Buffer) => {
        const keyPair = await mnemonicToPrivateKey(mnemonic);
        const signature = nacl.sign.detached(
            Buffer.from(sha256_sync(bufferToSign)),
            keyPair.secretKey
        );
        return signature;
    };
};

export const getSigner = async (
    sdk: IAppSdk,
    accountId: AccountId,
    checkTouchId: () => Promise<void>
): Promise<Signer> => {
    try {
        const account = await accountsStorage(sdk.storage).getAccount(accountId);
        if (!account) {
            throw new Error('Wallet not found');
        }

        switch (account.type) {
            case 'ton-only': {
                if (account.auth.kind === 'signer') {
                    const callback = async (message: Cell) => {
                        const result = await pairSignerByNotification(
                            sdk,
                            message.toBoc({ idx: false }).toString('base64')
                        );
                        return parseSignerSignature(result);
                    };
                    callback.type = 'cell' as const;
                    return callback;
                }

                if (account.auth.kind === 'signer-deeplink') {
                    const wallet = account.activeTonWallet;
                    const callback = async (message: Cell) => {
                        const deeplink = await storeTransactionAndCreateDeepLink(
                            sdk,
                            wallet.publicKey,
                            wallet.version,
                            message.toBoc({ idx: false }).toString('base64')
                        );

                        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                        window.location = deeplink as any;

                        await delay(2000);

                        throw new Error('Navigate to deeplink');
                    };
                    callback.type = 'cell' as const;
                    return callback as CellSigner;
                }

                return assertUnreachable(account.auth);
            }
            case 'ledger': {
                const callback = async (path: number[], transaction: LedgerTransaction) =>
                    pairLedgerByNotification(sdk, path, transaction);
                callback.type = 'ledger' as const;
                return callback;
            }
            case 'keystone': {
                const callback = async (message: Cell) => {
                    const result = await pairKeystoneByNotification(
                        sdk,
                        message.toBoc({ idx: false }),
                        'transaction',
                        account.pathInfo
                    );
                    return Buffer.from(result, 'hex');
                };
                callback.type = 'cell' as const;
                return callback;
            }
            default: {
                const mnemonic = await getMnemonic(sdk, account.id, checkTouchId);
                const callback = async (message: Cell) => {
                    const keyPair = await mnemonicToPrivateKey(mnemonic);
                    return sign(message.hash(), keyPair.secretKey);
                };
                callback.type = 'cell' as const;
                return callback;
            }
        }
    } catch (e) {
        console.error(e);
        throw e;
    }
};

export const getMnemonic = async (
    sdk: IAppSdk,
    accountId: AccountId,
    checkTouchId: () => Promise<void>
): Promise<string[]> => {
    const { mnemonic } = await getMnemonicAndPassword(sdk, accountId, checkTouchId);
    return mnemonic;
};

export const getMnemonicAndPassword = async (
    sdk: IAppSdk,
    accountId: AccountId,
    checkTouchId: () => Promise<void>
): Promise<{ mnemonic: string[]; password?: string }> => {
    const account = await accountsStorage(sdk.storage).getAccount(accountId);
    if (!account || account.type !== 'mnemonic' || !('auth' in account)) {
        throw new Error('Unexpected auth method for account');
    }

    switch (account.auth.kind) {
        case 'password': {
            const password = await getPasswordByNotification(sdk);
            const mnemonic = await decryptWalletMnemonic(
                account as { auth: AuthPassword },
                password
            );
            return {
                password,
                mnemonic
            };
        }
        case 'keychain': {
            if (!sdk.keychain) {
                throw Error('Keychain is undefined');
            }
            await checkTouchId();

            const mnemonic = await sdk.keychain.getPassword(account.auth.keychainStoreKey);
            return { mnemonic: mnemonic.split(' ') };
        }
        default:
            throw new Error('Unexpected auth method');
    }
};

export const getPasswordByNotification = async (sdk: IAppSdk): Promise<string> => {
    const id = Date.now();
    return new Promise<string>((resolve, reject) => {
        sdk.uiEvents.emit('getPassword', {
            method: 'getPassword',
            id,
            params: undefined
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

const pairSignerByNotification = async (sdk: IAppSdk, boc: string): Promise<string> => {
    const id = Date.now();
    return new Promise<string>((resolve, reject) => {
        sdk.uiEvents.emit('signer', {
            method: 'signer',
            id,
            params: boc
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

const pairKeystoneByNotification = async (
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

const pairLedgerByNotification = async (
    sdk: IAppSdk,
    path: number[],
    transaction: LedgerTransaction
): Promise<Cell> => {
    const id = Date.now();
    return new Promise<Cell>((resolve, reject) => {
        sdk.uiEvents.emit('ledger', {
            method: 'ledger',
            id,
            params: { path, transaction }
        });

        const onCallback = (message: {
            method: 'response';
            id?: number | undefined;
            params: unknown;
        }) => {
            if (message.id === id) {
                const { params } = message;
                sdk.uiEvents.off('response', onCallback);

                if (params && typeof params === 'object' && params instanceof Cell) {
                    resolve(params as Cell);
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
    });
};
