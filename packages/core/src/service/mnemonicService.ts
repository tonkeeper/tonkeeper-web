import { mnemonicValidate } from '@ton/crypto';
import { AppKey } from '../Keys';
import { IStorage } from '../Storage';
import { decrypt } from './cryptoService';

export const getWalletMnemonic = async (storage: IStorage, publicKey: string, password: string) => {
    const encryptedMnemonic = await storage.get<string>(`${AppKey.MNEMONIC}_${publicKey}`);
    if (!encryptedMnemonic) {
        throw new Error('Wallet mnemonic not fount');
    }
    const mnemonic = (await decrypt(encryptedMnemonic, password)).split(' ');
    const isValid = await mnemonicValidate(mnemonic);
    if (!isValid) {
        throw new Error('Wallet mnemonic not valid');
    }

    return mnemonic;
};

export const validateWalletMnemonic = async (
    storage: IStorage,
    publicKey: string,
    password: string
) => {
    try {
        await getWalletMnemonic(storage, publicKey, password);
        return true;
    } catch (e) {
        return false;
    }
};
