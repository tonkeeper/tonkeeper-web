import { mnemonicValidate } from '@ton/crypto';
import { decrypt } from './cryptoService';
import { AuthPassword } from '../entries/password';
import { MamRoot } from '@multi-account-mnemonic/core';

export const decryptWalletMnemonic = async (state: { auth: AuthPassword }, password: string) => {
    const mnemonic = (await decrypt(state.auth.encryptedMnemonic, password)).split(' ');
    const isValid = await mnemonicValidate(mnemonic);
    if (!isValid) {
        throw new Error('Wallet mnemonic not valid');
    }

    return mnemonic;
};

export const validateMnemonicTonOrMAM = async (mnemonic: string[]) => {
    const isValidTon = await mnemonicValidate(mnemonic);
    if (isValidTon) {
        return true;
    }

    try {
        await MamRoot.fromMnemonic(mnemonic);
        return true;
    } catch (e) {
        return false;
    }
};
