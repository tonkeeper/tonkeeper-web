import { IStorage } from '@tonkeeper/core/dist/Storage';
import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import {
    ClearStorageMessage,
    DeleteStorageMessage,
    GetStorageMessage,
    SetBatchStorageMessage,
    SetStorageMessage
} from '../libs/message';

const userHome = app.getPath('home');
const configRoot = path.join(userHome, '.tonkeeper');

if (!fs.existsSync(configRoot)) {
    fs.mkdirSync(configRoot);
}

const configPath = path.join(configRoot, 'config.json');

console.log('configPath', configPath);

const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);

const getConfig = async (): Promise<Record<string, unknown>> => {
    if (!fs.existsSync(configPath)) {
        return {};
    } else {
        const rawdata = await readFileAsync(configPath);
        return JSON.parse(rawdata.toString('utf8'));
    }
};

const setConfig = async (config: Record<string, unknown>) => {
    await writeFileAsync(configPath, JSON.stringify(config));
};

export const storageSet = async <R>({ key, value }: SetStorageMessage) => {
    const config = await getConfig();
    config[key] = value;
    await setConfig(config);
    return value as R;
};

export const storageGet = async <R>({ key }: GetStorageMessage) => {
    const config = await getConfig();
    return (config[key] ?? null) as R | null;
};

export const storageSetBatch = async <V>({ value }: SetBatchStorageMessage) => {
    const config = await getConfig();
    Object.assign(config, value);
    await setConfig(config);
    return value as V;
};

export const storageDelete = async <R>({ key }: DeleteStorageMessage) => {
    const config = await getConfig();
    const value = config[key];
    if (value) {
        delete config[key];
    }
    await setConfig(config);
    return (value ?? null) as R | null;
};

export const storageClear = async ({}: ClearStorageMessage) => {
    await setConfig({});
};

export class NodeStorage implements IStorage {
    get = async <R>(key: string) => {
        return storageGet<R>({ king: 'storage-get', key });
    };

    set = async <R>(key: string, value: R) => {
        return storageSet<R>({ king: 'storage-set', key, value });
    };

    setBatch = async <V extends Record<string, unknown>>(value: V) => {
        return storageSetBatch<V>({ king: 'storage-set-batch', value });
    };

    delete = async <R>(key: string) => {
        return storageDelete<R>({ king: 'storage-delete', key });
    };

    clear = async () => {
        await storageClear({ king: 'storage-clear' });
    };
}

export const mainStorage = new NodeStorage();
