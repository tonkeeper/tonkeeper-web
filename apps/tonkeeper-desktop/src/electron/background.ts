import { shell } from 'electron';
import keytar from 'keytar';
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
            return await keytar.setPassword(
                service,
                `Wallet-${message.publicKey}`,
                message.mnemonic
            );
        case 'get-keychain':
            return await keytar.getPassword(service, `Wallet-${message.publicKey}`);
        default:
            throw new Error(`Unknown message: ${JSON.stringify(message)}`);
    }
};
