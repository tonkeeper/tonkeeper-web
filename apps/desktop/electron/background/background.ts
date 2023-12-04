import { shell } from 'electron';
import { Message } from '../../src/libs/message';
import {
    storageClear,
    storageDelete,
    storageGet,
    storageSet,
    storageSetBatch
} from './storageService';

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
        default:
            throw new Error(`Unknown message: ${JSON.stringify(message)}`);
    }
};
