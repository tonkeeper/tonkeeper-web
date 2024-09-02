import { TonKeychainRoot } from '@ton-keychain/core';
import { mnemonicValidate } from '@ton/crypto';
import { AuthPassword } from '../entries/password';
import { decrypt } from './cryptoService';

export const decryptWalletMnemonic = async (state: { auth: AuthPassword }, password: string) => {
    const mnemonic = (await decrypt(state.auth.encryptedMnemonic, password)).split(' ');
    const isValid = await seeIfMnemonicValid(mnemonic);
    if (!isValid) {
        throw new Error('Wallet mnemonic not valid');
    }
    return mnemonic;
};

export const seeIfMnemonicValid = async (mnemonic: string[]) => {
    const isValid = await mnemonicValidate(mnemonic);
    if (!isValid) {
        const isMam = await validateMnemonicTonOrMAM(mnemonic);
        if (!isMam) {
            return false;
        }
    }
    return true;
};

export const validateMnemonicTonOrMAM = async (mnemonic: string[]) => {
    const isValidTon = await mnemonicValidate(mnemonic);
    if (isValidTon) {
        return true;
    }

    try {
        await TonKeychainRoot.fromMnemonic(mnemonic);
        return true;
    } catch (e) {
        return false;
    }
};
