import { Cell } from '@ton/core';
import { sha256_sync, sign } from '@ton/crypto';
import { IAppSdk } from '@tonkeeper/core/dist/AppSdk';
import { Account, AccountId, isAccountTronCompatible } from '@tonkeeper/core/dist/entries/account';
export { getTronSigner } from '@tonkeeper/core/dist/service/sign/strategies/tron/legacy-tron-signer';
import { MnemonicType } from '@tonkeeper/core/dist/entries/password';
import { MultiTransactionsSigner, Signer } from '@tonkeeper/core/dist/entries/signer';
import { TonWalletStandard, WalletId } from '@tonkeeper/core/dist/entries/wallet';
import { accountsStorage } from '@tonkeeper/core/dist/service/accountsStorage';
import {
    LedgerTonProofRequest,
    LedgerTonProofResponse
} from '@tonkeeper/core/dist/service/ledger/connector';
import { getLedgerAccountPathByIndex } from '@tonkeeper/core/dist/service/ledger/utils';
import { mnemonicToKeypair } from '@tonkeeper/core/dist/service/mnemonicService';
import { signWithSecret } from '@tonkeeper/core/dist/service/sign';
import { getSigner as coreGetSigner } from '@tonkeeper/core/dist/service/sign/factory';
import { SignerOptions } from '@tonkeeper/core/dist/service/sign/types';
import { pairLedgerByNotification } from '@tonkeeper/core/dist/service/sign/pairing';
import { getAccountSecret, getMAMWalletMnemonic } from '@tonkeeper/core/dist/service/sign/secrets';
import { TxConfirmationCustomError } from '@tonkeeper/core/dist/errors/TxConfirmationCustomError';
import { tonMnemonicToTronMnemonic } from '@tonkeeper/core/dist/service/walletService';
import { TronApi } from '@tonkeeper/core/dist/tronApi';
import { assertUnreachable } from '@tonkeeper/core/dist/utils/types';
import { useCallback } from 'react';
import type { Transaction } from 'tronweb/src/types/Transaction';
import nacl from 'tweetnacl';

import { useAppSdk } from '../hooks/appSdk';
import { useActiveAccount } from './wallet';
import { pairKeystoneByNotification } from '@tonkeeper/core/dist/service/sign/pairing';

export {
    getAccountSecret,
    getMAMWalletMnemonic,
    getPasswordByNotification,
    getSecretAndPassword
} from '@tonkeeper/core/dist/service/sign/secrets';

interface IGetSignerOptions extends SignerOptions {
    walletId?: WalletId;
}

/**
 * Thin wrapper kept so existing callers (and the `useGetAccountSigner`
 * hook below) don't need to touch import paths. Dispatch by
 * `(account.type, chain)` happens inside `coreGetSigner` via the
 * strategy registry in `@tonkeeper/core/dist/service/sign/factory`.
 */
export const getSigner = (
    sdk: IAppSdk,
    accountId: AccountId,
    options: IGetSignerOptions = {}
): Promise<Signer> => coreGetSigner(sdk, accountId, options);

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
                    'Signer linked by QR is not support sign data.',
                    'error_signer_doesnot_support_sign_data'
                );
            }
            case 'ledger': {
                throw new TxConfirmationCustomError(
                    t('ledger_operation_not_supported'),
                    'ledger_operation_not_supported'
                );
            }
            case 'keystone': {
                throw new TxConfirmationCustomError(
                    "Can't sign data over Keystone wallet",
                    'error_keystone_doesnot_support_sign_data'
                );
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
                throw new TxConfirmationCustomError(
                    "Can't sign data over watch-only wallet",
                    'error_watch_only_doesnot_support_sign_data'
                );
            }
            case 'ton-multisig': {
                throw new TxConfirmationCustomError(
                    "Can't sign data over multisig wallet",
                    'error_multisig_doesnot_support_sign_data'
                );
            }
            case 'multichain': {
                const secret = await getAccountSecret(sdk, accountId);
                if (secret.type !== 'mnemonic') {
                    throw new Error('Unexpected secret type');
                }
                const keyPair = await mnemonicToKeypair(secret.mnemonic, 'bip39');
                return nacl.sign.detached(payload, new Uint8Array(keyPair.secretKey));
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
                    'Signer linked by QR is not support sign buffer.',
                    'error_signer_doesnot_support_connect'
                );
            }
            case 'ledger': {
                throw new TxConfirmationCustomError(
                    t('ledger_operation_not_supported'),
                    'ledger_operation_not_supported'
                );
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
                throw new TxConfirmationCustomError(
                    "Can't use tonconnect over watch-only wallet",
                    'error_watch_only_doesnot_support_connection'
                );
            }
            case 'ton-multisig': {
                throw new TxConfirmationCustomError(
                    "Can't use multisig wallet with this dApp",
                    'error_multisig_doesnot_support_connection'
                );
            }
            case 'multichain': {
                const secret = await getAccountSecret(sdk, accountId);
                if (secret.type !== 'mnemonic') {
                    throw new Error('Unexpected secret type');
                }
                const keyPair = await mnemonicToKeypair(secret.mnemonic, 'bip39');
                return nacl.sign.detached(
                    Buffer.from(sha256_sync(bufferToSign)),
                    keyPair.secretKey
                );
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

export const getMultiPayloadSigner = (
    sdk: IAppSdk,
    tronApi: TronApi,
    account: Account
): MultiTransactionsSigner => {
    try {
        if (!isAccountTronCompatible(account)) {
            throw new Error("Account doesn't support tron");
        }

        const wallet = account.activeTronWallet;

        if (!wallet) {
            throw new Error('Wallet not found');
        }

        return async (txs: (Transaction | Cell)[]) => {
            let tonMnemonic: string[];
            let tonMnemonicType: MnemonicType | undefined;

            switch (account.type) {
                case 'mam': {
                    tonMnemonic = await getMAMWalletMnemonic(
                        sdk,
                        account.id,
                        account.activeTonWallet.id
                    );
                    tonMnemonicType = 'ton';
                    break;
                }
                case 'mnemonic': {
                    const secret = await getAccountSecret(sdk, account.id);
                    if (secret.type !== 'mnemonic') {
                        throw new Error('Unexpected secret type');
                    }
                    tonMnemonic = secret.mnemonic;
                    tonMnemonicType = account.mnemonicType;
                    break;
                }
                default: {
                    assertUnreachable(account);
                }
            }

            const tonKeyPair = await mnemonicToKeypair(tonMnemonic, tonMnemonicType);
            const tronMnemonic = await tonMnemonicToTronMnemonic(tonMnemonic, tonMnemonicType);
            const { TronWeb } = await import('tronweb');
            const tronWeb = new TronWeb({
                fullHost: tronApi.tronGridBaseUrl,
                privateKey: TronWeb.fromMnemonic(tronMnemonic.join(' ')).privateKey.slice(2)
            });

            return Promise.all(
                txs.map(tx => {
                    if (tx instanceof Cell) {
                        return sign(tx.hash(), tonKeyPair.secretKey);
                    } else {
                        return tronWeb.trx.sign(tx);
                    }
                })
            );
        };
    } catch (e) {
        console.error(e);
        throw e;
    }
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

export const useGetActiveAccountSecret = () => {
    const sdk = useAppSdk();
    const activeAccount = useActiveAccount();
    const accountId = activeAccount.id;

    return useCallback(async () => {
        return getAccountSecret(sdk, accountId);
    }, [sdk, accountId]);
};
