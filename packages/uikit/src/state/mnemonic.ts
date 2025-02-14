import { TonKeychainRoot } from '@ton-keychain/core';
import { Cell } from '@ton/core';
import { keyPairFromSecretKey, sha256_sync, sign } from '@ton/crypto';
import { IAppSdk } from '@tonkeeper/core/dist/AppSdk';
import {
    AccountId,
    isAccountTronCompatible,
    isMnemonicAndPassword,
    Account,
    AccountSecret
} from '@tonkeeper/core/dist/entries/account';
import { AuthPassword, MnemonicType } from '@tonkeeper/core/dist/entries/password';
import { CellSigner, Signer, TronSigner } from '@tonkeeper/core/dist/entries/signer';
import { TonWalletStandard, WalletId } from '@tonkeeper/core/dist/entries/wallet';
import { accountsStorage } from '@tonkeeper/core/dist/service/accountsStorage';
import { KeystoneMessageType } from '@tonkeeper/core/dist/service/keystone/types';
import {
    LedgerTonProofRequest,
    LedgerTonProofResponse,
    LedgerTransaction
} from '@tonkeeper/core/dist/service/ledger/connector';
import {
    decryptWalletSecret,
    mnemonicToKeypair,
    walletSecretFromString
} from '@tonkeeper/core/dist/service/mnemonicService';
import {
    parseSignerSignature,
    storeTransactionAndCreateDeepLink
} from '@tonkeeper/core/dist/service/signerService';
import { delay } from '@tonkeeper/core/dist/utils/common';
import { assertUnreachable } from '@tonkeeper/core/dist/utils/types';
import nacl from 'tweetnacl';
import { TxConfirmationCustomError } from '../libs/errors/TxConfirmationCustomError';
import { getLedgerAccountPathByIndex } from '@tonkeeper/core/dist/service/ledger/utils';
import { useAppSdk } from '../hooks/appSdk';
import { useCallback } from 'react';
import { useActiveAccount } from './wallet';
import { useCheckTouchId } from './password';
import { tonMnemonicToTronMnemonic } from '@tonkeeper/core/dist/service/walletService';
import { TronWeb } from 'tronweb';
import type { Transaction } from 'tronweb/src/types/Transaction';
import { TronApi } from '@tonkeeper/core/dist/tronApi';

export const signTonConnectOver = ({
    sdk,
    accountId,
    checkTouchId,
    wallet,
    t
}: {
    sdk: IAppSdk;
    accountId: AccountId;
    wallet?: TonWalletStandard;
    t: (text: string) => string;
    checkTouchId: () => Promise<void>;
}) => {
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
            case 'testnet':
            case 'mnemonic': {
                const secret = await getAccountSecret(sdk, accountId, checkTouchId);
                if (secret.type !== 'mnemonic') {
                    throw new Error('Unexpected secret type');
                }
                const keyPair = await mnemonicToKeypair(secret.mnemonic, account.mnemonicType);
                return nacl.sign.detached(
                    Buffer.from(sha256_sync(bufferToSign)),
                    keyPair.secretKey
                );
            }
            case 'mam': {
                const w = wallet ?? account.activeTonWallet;
                const mnemonic = await getMAMWalletMnemonic(sdk, account.id, w.id, checkTouchId);
                const keyPair = await mnemonicToKeypair(mnemonic, 'ton');
                return nacl.sign.detached(
                    Buffer.from(sha256_sync(bufferToSign)),
                    keyPair.secretKey
                );
            }
            case 'sk': {
                const secret = await getAccountSecret(sdk, accountId, checkTouchId);
                if (secret.type !== 'sk') {
                    throw new Error('Unexpected secret type');
                }
                const keyPair = keyPairFromSecretKey(Buffer.from(secret.sk, 'hex'));
                return nacl.sign.detached(
                    Buffer.from(sha256_sync(bufferToSign)),
                    keyPair.secretKey
                );
            }
            case 'watch-only': {
                throw new TxConfirmationCustomError("Can't use tonconnect over watch-only wallet");
            }
            case 'ton-multisig': {
                throw new TxConfirmationCustomError("Can't use multisig wallet with this dApp");
            }
            default: {
                assertUnreachable(account);
            }
        }
    };
};

export const signTonConnectMnemonicOver = (mnemonic: string[], mnemonicType: MnemonicType) => {
    return async (bufferToSign: Buffer) => {
        const keyPair = await mnemonicToKeypair(mnemonic, mnemonicType);
        const signature = nacl.sign.detached(
            Buffer.from(sha256_sync(bufferToSign)),
            keyPair.secretKey
        );
        return signature;
    };
};

export const useGetActiveAccountSigner = () => {
    const account = useActiveAccount();
    const _getSigner = useGetAccountSigner();
    return useCallback(
        (walletId?: WalletId) => {
            return _getSigner(account.id, walletId);
        },
        [account, _getSigner]
    );
};

export const useGetAccountSigner = () => {
    const sdk = useAppSdk();
    const { mutateAsync: checkTouchId } = useCheckTouchId();

    return useCallback(
        (accountId: AccountId, walletId?: WalletId) =>
            getSigner(sdk, accountId, checkTouchId, walletId ? { walletId } : undefined),
        [sdk, checkTouchId]
    );
};

export const getSigner = async (
    sdk: IAppSdk,
    accountId: AccountId,
    checkTouchId: () => Promise<void>,
    {
        walletId
    }: {
        walletId?: WalletId;
    } = {}
): Promise<Signer> => {
    try {
        const account = await accountsStorage(sdk.storage).getAccount(accountId);
        if (!account) {
            throw new Error('Wallet not found');
        }

        const wallet =
            walletId !== undefined ? account.getTonWallet(walletId) : account.activeTonWallet;

        switch (account.type) {
            case 'ton-only': {
                if (account.auth.kind === 'signer') {
                    const callback = async (message: Cell) => {
                        const result = await pairSignerByNotification(
                            sdk,
                            message.toBoc({ idx: false }).toString('base64'),
                            wallet as TonWalletStandard
                        );
                        return parseSignerSignature(result);
                    };
                    callback.type = 'cell' as const;
                    return callback;
                }

                if (account.auth.kind === 'signer-deeplink') {
                    const callback = async (message: Cell) => {
                        const deeplink = await storeTransactionAndCreateDeepLink(
                            sdk,
                            (wallet as TonWalletStandard).publicKey,
                            (wallet as TonWalletStandard).version,
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
                const derivation = account.allAvailableDerivations.find(
                    d => d.activeTonWalletId === wallet!.id
                )!;
                const path = getLedgerAccountPathByIndex(derivation.index);
                const callback = async (transactions: LedgerTransaction[]) =>
                    pairLedgerByNotification<'transaction'>(sdk, path, { transactions });
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
            case 'mam': {
                const mnemonic = await getMAMWalletMnemonic(
                    sdk,
                    account.id,
                    wallet!.id,
                    checkTouchId
                );
                const callback = async (message: Cell) => {
                    const keyPair = await mnemonicToKeypair(mnemonic, 'ton');
                    return sign(message.hash(), keyPair.secretKey);
                };
                callback.type = 'cell' as const;
                return callback;
            }
            case 'testnet':
            case 'mnemonic': {
                const secret = await getAccountSecret(sdk, account.id, checkTouchId);
                if (secret.type !== 'mnemonic') {
                    throw new Error('Unexpected secret type');
                }
                const callback = async (message: Cell) => {
                    const keyPair = await mnemonicToKeypair(secret.mnemonic, account.mnemonicType);
                    return sign(message.hash(), keyPair.secretKey);
                };
                callback.type = 'cell' as const;
                return callback;
            }
            case 'sk': {
                const secret = await getAccountSecret(sdk, accountId, checkTouchId);
                if (secret.type !== 'sk') {
                    throw new Error('Unexpected secret type');
                }
                const callback = async (message: Cell) => {
                    const keyPair = keyPairFromSecretKey(Buffer.from(secret.sk, 'hex'));
                    return sign(message.hash(), keyPair.secretKey);
                };
                callback.type = 'cell' as const;
                return callback;
            }
            case 'watch-only': {
                throw new Error('Cannot get signer for watch-only account');
            }
            case 'ton-multisig': {
                throw new Error('Cannot get signer for multisig account');
            }
            default: {
                assertUnreachable(account);
            }
        }
    } catch (e) {
        console.error(e);
        throw e;
    }
};

export const getTronSigner = (
    sdk: IAppSdk,
    tronApi: TronApi,
    account: Account,
    checkTouchId: () => Promise<void>
): TronSigner => {
    try {
        if (!isAccountTronCompatible(account)) {
            throw new Error("Account doesn't support tron");
        }

        const wallet = account.activeTronWallet;

        if (!wallet) {
            throw new Error('Wallet not found');
        }

        switch (account.type) {
            case 'mam': {
                return async (tx: Transaction) => {
                    const tonMnemonic = await getMAMWalletMnemonic(
                        sdk,
                        account.id,
                        wallet!.id,
                        checkTouchId
                    );
                    const tronMnemonic = await tonMnemonicToTronMnemonic(tonMnemonic, 'ton');

                    const tronWeb = new TronWeb({
                        fullHost: tronApi.tronGridBaseUrl,
                        privateKey: TronWeb.fromMnemonic(tronMnemonic.join(' ')).privateKey.slice(2)
                    });

                    return tronWeb.trx.sign(tx);
                };
            }
            case 'mnemonic': {
                return async (tx: Transaction) => {
                    const secret = await getAccountSecret(sdk, account.id, checkTouchId);
                    if (secret.type !== 'mnemonic') {
                        throw new Error('Unexpected secret type');
                    }
                    const tonMnemonic = secret.mnemonic;
                    const tronMnemonic = await tonMnemonicToTronMnemonic(
                        tonMnemonic,
                        account.mnemonicType
                    );

                    const tronWeb = new TronWeb({
                        fullHost: tronApi.tronGridBaseUrl,
                        privateKey: TronWeb.fromMnemonic(tronMnemonic.join(' ')).privateKey.slice(2)
                    });

                    return tronWeb.trx.sign(tx);
                };
            }
            default: {
                assertUnreachable(account);
            }
        }
    } catch (e) {
        console.error(e);
        throw e;
    }
};

export const getAccountSecret = async (
    sdk: IAppSdk,
    accountId: AccountId,
    checkTouchId: () => Promise<void>
): Promise<AccountSecret> => {
    const { secret } = await getSecretAndPassword(sdk, accountId, checkTouchId);
    return secret;
};

export const getMAMWalletMnemonic = async (
    sdk: IAppSdk,
    accountId: AccountId,
    walletId: WalletId,
    checkTouchId: () => Promise<void>
): Promise<string[]> => {
    const account = await accountsStorage(sdk.storage).getAccount(accountId);
    if (account?.type !== 'mam') {
        throw new Error('Unexpected account type');
    }
    const derivation = account.getTonWalletsDerivation(walletId);
    if (!derivation) {
        throw new Error('Derivation not found');
    }

    const { secret } = await getSecretAndPassword(sdk, accountId, checkTouchId);
    if (secret.type !== 'mnemonic') {
        throw new Error('Unexpected secret type');
    }
    const root = await TonKeychainRoot.fromMnemonic(secret.mnemonic, { allowLegacyMnemonic: true });
    const tonAccount = await root.getTonAccount(derivation.index);
    return tonAccount.mnemonics;
};

export const getSecretAndPassword = async (
    sdk: IAppSdk,
    accountId: AccountId,
    checkTouchId: () => Promise<void>
): Promise<{ secret: AccountSecret; password?: string }> => {
    const account = await accountsStorage(sdk.storage).getAccount(accountId);
    if (!account || !isMnemonicAndPassword(account) || !('auth' in account)) {
        throw new Error('Unexpected auth method for account');
    }

    switch (account.auth.kind) {
        case 'password': {
            const password = await getPasswordByNotification(sdk);
            const secret = await decryptWalletSecret(
                (account.auth as AuthPassword).encryptedSecret,
                password
            );
            return {
                password,
                secret
            };
        }
        case 'keychain': {
            if (!sdk.keychain) {
                throw Error('Keychain is undefined');
            }
            await checkTouchId();

            const secret = await sdk.keychain.getPassword(account.auth.keychainStoreKey);
            return { secret: await walletSecretFromString(secret) };
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

const pairSignerByNotification = async (
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

export const getLedgerTonProofSigner = async (
    sdk: IAppSdk,
    accountId: AccountId,
    {
        walletId
    }: {
        walletId?: WalletId;
    } = {}
): Promise<(request: LedgerTonProofRequest) => Promise<LedgerTonProofResponse>> => {
    const account = await accountsStorage(sdk.storage).getAccount(accountId);
    if (!account) {
        throw new Error('Account not found');
    }

    if (account.type !== 'ledger') {
        throw new Error('Unexpected account type');
    }

    const wallet =
        walletId !== undefined ? account.getTonWallet(walletId) : account.activeTonWallet;

    const derivation = account.allAvailableDerivations.find(
        d => d.activeTonWalletId === wallet!.id
    )!;
    const path = getLedgerAccountPathByIndex(derivation.index);
    const callback = async (tonProof: LedgerTonProofRequest) =>
        pairLedgerByNotification<'ton-proof'>(sdk, path, { tonProof });
    callback.type = 'ledger' as const;
    return callback;
};

const pairLedgerByNotification = async <T extends 'transaction' | 'ton-proof'>(
    sdk: IAppSdk,
    path: number[],
    request: T extends 'transaction'
        ? {
              transactions: LedgerTransaction[];
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

export const useGetActiveAccountSecret = () => {
    const sdk = useAppSdk();
    const { mutateAsync: checkTouchId } = useCheckTouchId();
    const activeAccount = useActiveAccount();
    const accountId = activeAccount.id;

    return useCallback(async () => {
        return getAccountSecret(sdk, accountId, checkTouchId);
    }, [sdk, checkTouchId, accountId]);
};
