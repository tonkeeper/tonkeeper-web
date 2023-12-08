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

export const storageSet = async ({ key, value }: SetStorageMessage) => {
    const config = await getConfig();
    config[key] = value;
    await setConfig(config);
    return value;
};

export const storageGet = async ({ key }: GetStorageMessage) => {
    const config = await getConfig();
    return config[key] ?? null;
};

export const storageSetBatch = async ({ value }: SetBatchStorageMessage) => {
    const config = await getConfig();
    Object.assign(config, value);
    await setConfig(config);
    return value;
};

export const storageDelete = async ({ key }: DeleteStorageMessage) => {
    const config = await getConfig();
    const value = config[key];
    if (value) {
        delete config[key];
    }
    await setConfig(config);
    return value ?? null;
};

export const storageClear = async ({}: ClearStorageMessage) => {
    await setConfig({});
};
