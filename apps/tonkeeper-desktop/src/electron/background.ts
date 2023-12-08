import { shell } from 'electron';
import * as keychain from 'keychain';
import { Message } from '../libs/message';
import {
    storageClear,
    storageDelete,
    storageGet,
    storageSet,
    storageSetBatch
} from './storageService';

const service = 'tonkeeper.com';

export const handleBackgroundMessage = async (message: Message): Promise<unknown> => {
    switch (message.king) {
        case 'storage-set':
            return storageSet(message);
        case 'storage-get':
            return storageGet(message);
        case 'storage-set-batch':
            return storageSetBatch(message);
        case 'storage-delete':
            return storageDelete(message);
        case 'storage-clear':
            return storageClear(message);
        case 'open-page':
            return shell.openExternal(message.url);
        case 'set-keychain':
            return new Promise((resolve, reject) => {
                keychain.setPassword(
                    {
                        account: `Wallet-${message.publicKey}`,
                        service,
                        password: message.mnemonic
                    },
                    error => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(undefined);
                        }
                    }
                );
            });
        case 'get-keychain':
            return new Promise((resolve, reject) => {
                keychain.getPassword(
                    {
                        account: `Wallet-${message.publicKey}`,
                        service
                    },
                    (error, password) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(password);
                        }
                    }
                );
            });
        default:
            throw new Error(`Unknown message: ${JSON.stringify(message)}`);
    }
};
