import { TonKeychainRoot } from '@ton-keychain/core';
import { Cell } from '@ton/core';
import { sha256_sync, sign } from '@ton/crypto';
import { IAppSdk } from '@tonkeeper/core/dist/AppSdk';
import {
    AccountId,
    isAccountTronCompatible,
    isMnemonicAndPassword,
    Account,
    AccountSecret
} from '@tonkeeper/core/dist/entries/account';
import { AuthPassword, MnemonicType } from '@tonkeeper/core/dist/entries/password';
import {
    CellSigner,
    OpenedSignerProvider,
    Signer,
    TronSigner
} from '@tonkeeper/core/dist/entries/signer';
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
    createSignerTxDeepLink,
    parseSignerSignature
} from '@tonkeeper/core/dist/service/signerService';
import { delay } from '@tonkeeper/core/dist/utils/common';
import { assertUnreachable } from '@tonkeeper/core/dist/utils/types';
import nacl from 'tweetnacl';
import { TxConfirmationCustomError } from '../libs/errors/TxConfirmationCustomError';
import { getLedgerAccountPathByIndex } from '@tonkeeper/core/dist/service/ledger/utils';
import { useAppSdk } from '../hooks/appSdk';
import { useCallback } from 'react';
import { useActiveAccount } from './wallet';
import { tonMnemonicToTronMnemonic } from '@tonkeeper/core/dist/service/walletService';
import type { Transaction } from 'tronweb/src/types/Transaction';
import { TronApi } from '@tonkeeper/core/dist/tronApi';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { signWithSecret } from '@tonkeeper/core/dist/service/sign';

export const signDataOver = ({
    sdk,
    accountId,
    wallet,
    t
}: {
    sdk: IAppSdk;
    accountId: AccountId;
    wallet?: TonWalletStandard;
    t: (text: string) => string;
}) => {
    return async (payload: Uint8Array) => {
        const account = await accountsStorage(sdk.storage).getAccount(accountId);

        if (!account) {
            throw new Error("Can't use sign data over non standard ton wallet");
        }

        switch (account.type) {
            case 'ton-only': {
                throw new TxConfirmationCustomError(
                    'Signer linked by QR is not support sign data.'
                );
            }
            case 'ledger': {
                throw new TxConfirmationCustomError(t('ledger_operation_not_supported'));
            }
            case 'keystone': {
                throw new TxConfirmationCustomError("Can't sign data over Keystone wallet");
            }
            case 'testnet':
            case 'mnemonic': {
                const secret = await getAccountSecret(sdk, accountId);
                if (secret.type !== 'mnemonic') {
                    throw new Error('Unexpected secret type');
                }
                const keyPair = await mnemonicToKeypair(secret.mnemonic, account.mnemonicType);
                return nacl.sign.detached(payload, new Uint8Array(keyPair.secretKey));
            }
            case 'mam': {
                const w = wallet ?? account.activeTonWallet;
                const mnemonic = await getMAMWalletMnemonic(sdk, account.id, w.id);
                const keyPair = await mnemonicToKeypair(mnemonic, 'ton');
                return nacl.sign.detached(payload, new Uint8Array(keyPair.secretKey));
            }
            case 'sk': {
                const secret = await getAccountSecret(sdk, accountId);
                if (secret.type !== 'sk') {
                    throw new Error('Unexpected secret type');
                }
                return signWithSecret(payload, {
                    key: secret.sk,
                    algorithm: account.signingAlgorithm
                });
            }
            case 'watch-only': {
                throw new TxConfirmationCustomError("Can't sign data over watch-only wallet");
            }
            case 'ton-multisig': {
                throw new TxConfirmationCustomError("Can't sign data over multisig wallet");
            }
            default: {
                assertUnreachable(account);
            }
        }
    };
};

export const signTonConnectOver = ({
    sdk,
    accountId,
    wallet,
    t
}: {
    sdk: IAppSdk;
    accountId: AccountId;
    wallet?: TonWalletStandard;
    t: (text: string) => string;
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
                const secret = await getAccountSecret(sdk, accountId);
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
                const mnemonic = await getMAMWalletMnemonic(sdk, account.id, w.id);
                const keyPair = await mnemonicToKeypair(mnemonic, 'ton');
                return nacl.sign.detached(
                    Buffer.from(sha256_sync(bufferToSign)),
                    keyPair.secretKey
                );
            }
            case 'sk': {
                const secret = await getAccountSecret(sdk, accountId);
                if (secret.type !== 'sk') {
                    throw new Error('Unexpected secret type');
                }
                return signWithSecret(sha256_sync(bufferToSign), {
                    key: secret.sk,
                    algorithm: account.signingAlgorithm
                });
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

    return useCallback(
        (accountId: AccountId, walletId?: WalletId) =>
            getSigner(sdk, accountId, walletId ? { walletId } : undefined),
        [sdk]
    );
};

export const getSigner = async (
    sdk: IAppSdk,
    accountId: AccountId,
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
                    if (sdk.targetEnv === 'web') {
                        const callback = async (message: Cell) => {
                            const messageBase64 = message.toBoc({ idx: false }).toString('base64');
                            await sdk.storage.set(AppKey.SIGNER_MESSAGE, messageBase64);

                            const deeplink = await createSignerTxDeepLink(
                                sdk,
                                (wallet as TonWalletStandard).publicKey,
                                (wallet as TonWalletStandard).version,
                                messageBase64
                            );

                            /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                            window.location = deeplink as any;

                            await delay(2000);

                            throw new Error('Navigate to deeplink');
                        };
                        callback.type = 'cell' as const;
                        return callback as CellSigner;
                    } else {
                        const callback = async (message: Cell) => {
                            const deeplink = await createSignerTxDeepLink(
                                sdk,
                                (wallet as TonWalletStandard).publicKey,
                                (wallet as TonWalletStandard).version,
                                message.toBoc({ idx: false }).toString('base64')
                            );

                            sdk.openPage(deeplink);

                            return new Promise<Buffer>(res => {
                                sdk.uiEvents.once('signerTxResponse', options => {
                                    res(Buffer.from(options.params.signatureHex, 'hex'));
                                });
                            });
                        };
                        callback.type = 'cell' as const;
                        return callback;
                    }
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
                const mnemonic = await getMAMWalletMnemonic(sdk, account.id, wallet!.id);
                const callback = async (message: Cell) => {
                    const keyPair = await mnemonicToKeypair(mnemonic, 'ton');
                    return sign(message.hash(), keyPair.secretKey);
                };
                callback.type = 'cell' as const;
                return callback;
            }
            case 'testnet':
            case 'mnemonic': {
                const secret = await getAccountSecret(sdk, account.id);
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
                const secret = await getAccountSecret(sdk, accountId);
                if (secret.type !== 'sk') {
                    throw new Error('Unexpected secret type');
                }
                const callback = (message: Cell) => {
                    return signWithSecret(message.hash(), {
                        key: secret.sk,
                        algorithm: account.signingAlgorithm
                    });
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

export const getTronSigner = (sdk: IAppSdk, tronApi: TronApi, account: Account): TronSigner => {
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
                        account.activeTonWallet.id
                    );
                    const tronMnemonic = await tonMnemonicToTronMnemonic(tonMnemonic, 'ton');
                    const { TronWeb } = await import('tronweb');
                    const tronWeb = new TronWeb({
                        fullHost: tronApi.tronGridBaseUrl,
                        privateKey: TronWeb.fromMnemonic(tronMnemonic.join(' ')).privateKey.slice(2)
                    });

                    return tronWeb.trx.sign(tx);
                };
            }
            case 'mnemonic': {
                return async (tx: Transaction) => {
                    const secret = await getAccountSecret(sdk, account.id);
                    if (secret.type !== 'mnemonic') {
                        throw new Error('Unexpected secret type');
                    }
                    const tonMnemonic = secret.mnemonic;
                    const tronMnemonic = await tonMnemonicToTronMnemonic(
                        tonMnemonic,
                        account.mnemonicType
                    );
                    const { TronWeb } = await import('tronweb');
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

const closedSigner = () => {
    throw new Error('Call outside of callback is not allowed');
};
closedSigner.type = 'cell' as const;

export const getOpenedSignerProvider = (
    sdk: IAppSdk,
    tronApi: TronApi,
    account: Account
): OpenedSignerProvider => {
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
                return async (callback: Parameters<OpenedSignerProvider>[0]) => {
                    const tonMnemonic = await getMAMWalletMnemonic(
                        sdk,
                        account.id,
                        account.activeTonWallet.id
                    );
                    let cellSigner: CellSigner = (async message => {
                        const keyPair = await mnemonicToKeypair(tonMnemonic, 'ton');
                        return sign(message.hash(), keyPair.secretKey);
                    }) as CellSigner;
                    cellSigner.type = 'cell' as const;

                    const tronMnemonic = await tonMnemonicToTronMnemonic(tonMnemonic, 'ton');
                    let tronSigner: TronSigner = async tx => {
                        const { TronWeb } = await import('tronweb');
                        const tronWeb = new TronWeb({
                            fullHost: tronApi.tronGridBaseUrl,
                            privateKey: TronWeb.fromMnemonic(
                                tronMnemonic.join(' ')
                            ).privateKey.slice(2)
                        });
                        return tronWeb.trx.sign(tx);
                    };

                    await callback({ cellSigner, tronSigner });

                    /**
                     * Force clear memory and prevent signers from being used outside of callback
                     */
                    tonMnemonic.fill('');
                    tronMnemonic.fill('');
                    cellSigner = closedSigner;
                    tronSigner = closedSigner;
                };
            }
            case 'mnemonic': {
                return async (callback: Parameters<OpenedSignerProvider>[0]) => {
                    const secret = await getAccountSecret(sdk, account.id);
                    if (secret.type !== 'mnemonic') {
                        throw new Error('Unexpected secret type');
                    }
                    const tonMnemonic = secret.mnemonic;

                    let cellSigner: CellSigner = (async (message: Cell) => {
                        const keyPair = await mnemonicToKeypair(
                            secret.mnemonic,
                            account.mnemonicType
                        );
                        return sign(message.hash(), keyPair.secretKey);
                    }) as CellSigner;
                    cellSigner.type = 'cell' as const;

                    const tronMnemonic = await tonMnemonicToTronMnemonic(
                        tonMnemonic,
                        account.mnemonicType
                    );
                    let tronSigner: TronSigner = async tx => {
                        const { TronWeb } = await import('tronweb');
                        const tronWeb = new TronWeb({
                            fullHost: tronApi.tronGridBaseUrl,
                            privateKey: TronWeb.fromMnemonic(
                                tronMnemonic.join(' ')
                            ).privateKey.slice(2)
                        });

                        return tronWeb.trx.sign(tx);
                    };

                    await callback({ cellSigner, tronSigner });

                    /**
                     * Force clear memory and prevent signers from being used outside of callback
                     */
                    tonMnemonic.fill('');
                    tronMnemonic.fill('');
                    cellSigner = closedSigner;
                    tronSigner = closedSigner;
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
    accountId: AccountId
): Promise<AccountSecret> => {
    const { secret } = await getSecretAndPassword(sdk, accountId);
    return secret;
};

export const getMAMWalletMnemonic = async (
    sdk: IAppSdk,
    accountId: AccountId,
    walletId: WalletId
): Promise<string[]> => {
    const account = await accountsStorage(sdk.storage).getAccount(accountId);
    if (account?.type !== 'mam') {
        throw new Error('Unexpected account type');
    }
    const derivation = account.getTonWalletsDerivation(walletId);
    if (!derivation) {
        throw new Error('Derivation not found');
    }

    const { secret } = await getSecretAndPassword(sdk, accountId);
    if (secret.type !== 'mnemonic') {
        throw new Error('Unexpected secret type');
    }
    const root = await TonKeychainRoot.fromMnemonic(secret.mnemonic, { allowLegacyMnemonic: true });
    const tonAccount = await root.getTonAccount(derivation.index);
    return tonAccount.mnemonics;
};

export const getSecretAndPassword = async (
    sdk: IAppSdk,
    accountId: AccountId
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

            const secret = await sdk.keychain.getData(account.auth.keychainStoreKey);
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
    const activeAccount = useActiveAccount();
    const accountId = activeAccount.id;

    return useCallback(async () => {
        return getAccountSecret(sdk, accountId);
    }, [sdk, accountId]);
};
