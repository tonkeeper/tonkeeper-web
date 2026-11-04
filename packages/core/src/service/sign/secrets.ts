import { TonKeychainRoot } from '@ton-keychain/core';

import { IAppSdk } from '../../AppSdk';
import { AccountId, AccountSecret, isSecretBearingAccount } from '../../entries/account';
import { WalletId } from '../../entries/wallet';
import { accountsStorage } from '../accountsStorage';
import { isLegacyEncryptedSecret } from '../cryptoService';
import {
    decryptWalletSecret,
    encryptWalletSecret,
    walletSecretFromString
} from '../mnemonicService';

/**
 * Account secret retrieval shared by every TON signing strategy and by
 * the surrounding wallet-state hooks (recovery, settings, password
 * flows). Living in core keeps the strategies self-contained — no uikit
 * dependency for what is fundamentally a storage read.
 */

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

export const getSecretAndPassword = async (
    sdk: IAppSdk,
    accountId: AccountId
): Promise<{ secret: AccountSecret; password?: string }> => {
    const account = await accountsStorage(sdk.storage).getAccount(accountId);
    if (!account || !isSecretBearingAccount(account) || !('auth' in account)) {
        throw new Error('Unexpected auth method for account');
    }

    switch (account.auth.kind) {
        case 'password': {
            const password = await getPasswordByNotification(sdk);
            const encryptedSecret = account.auth.encryptedSecret;
            const secret = await decryptWalletSecret(encryptedSecret, password);

            if (isLegacyEncryptedSecret(encryptedSecret)) {
                try {
                    const upgraded = await encryptWalletSecret(secret, password);
                    account.auth.encryptedSecret = upgraded;
                    await accountsStorage(sdk.storage).updateAccountInState(account);
                } catch (e) {
                    console.error('Failed to upgrade encrypted wallet secret to v2 KDF', e);
                }
            }

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
