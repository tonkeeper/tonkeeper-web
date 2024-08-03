import { IStorage } from '@tonkeeper/core/dist/Storage';
import { sendBackground } from './backgroudService';

export class DesktopStorage implements IStorage {
    get = async <R>(key: string) => {
        return sendBackground<R>({ king: 'storage-get', key });
    };

    set = async <R>(key: string, value: R) => {
        return sendBackground<R>({ king: 'storage-set', key, value });
    };

    setBatch = async <V extends Record<string, unknown>>(value: V) => {
        return sendBackground<V>({ king: 'storage-set-batch', value });
    };

    delete = async <R>(key: string) => {
        return sendBackground<R>({ king: 'storage-delete', key });
    };

    clear = async () => {
        await sendBackground({ king: 'storage-clear' });
    };
}
