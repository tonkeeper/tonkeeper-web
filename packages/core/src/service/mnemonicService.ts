import { TonKeychainRoot } from '@ton-keychain/core';
import {
    keyPairFromSeed,
    mnemonicToPrivateKey,
    mnemonicValidate as validateStandardTonMnemonic
} from '@ton/crypto';
import { AuthPassword, MnemonicType } from '../entries/password';
import { decrypt } from './cryptoService';
import { mnemonicToSeed, validateMnemonic as validBip39Mnemonic } from 'bip39';
import { deriveED25519Path } from './ed25519';
import { assertUnreachable } from '../utils/types';

export const decryptWalletMnemonic = async (state: { auth: AuthPassword }, password: string) => {
    const mnemonic = (await decrypt(state.auth.encryptedMnemonic, password)).split(' ');
    const isValid = await seeIfMnemonicValid(mnemonic);
    if (!isValid) {
        throw new Error('Wallet mnemonic not valid');
    }
    return mnemonic;
};

export const seeIfMnemonicValid = async (mnemonic: string[]) => {
    const isValid = await validateStandardTonMnemonic(mnemonic);
    if (!isValid) {
        const isMam = await validateMnemonicTonOrMAM(mnemonic);
        if (!isMam) {
            return false;
        }
    }
    return true;
};

export const validateMnemonicTonOrMAM = async (mnemonic: string[]) => {
    if (await validateMnemonicStandardOrBip39Ton(mnemonic)) {
        return true;
    }

    return TonKeychainRoot.isValidMnemonic(mnemonic);
};

export const validateMnemonicStandardOrBip39Ton = async (mnemonic: string[]) => {
    if (await validateStandardTonMnemonic(mnemonic)) {
        return true;
    }

    if (validBip39Mnemonic(mnemonic.join(' '))) {
        return true;
    }

    return false;
};

export const validateBip39Mnemonic = (mnemonic: string[]) => {
    return validBip39Mnemonic(mnemonic.join(' '));
};

async function bip39ToPrivateKey(mnemonic: string[]) {
    const seed = await mnemonicToSeed(mnemonic.join(' '));
    const TON_DERIVATION_PATH = "m/44'/607'/0'";
    const seedContainer = deriveED25519Path(TON_DERIVATION_PATH, seed.toString('hex'));
    return keyPairFromSeed(seedContainer.key);
}

export const mnemonicToKeypair = async (mnemonic: string[], mnemonicType?: MnemonicType) => {
    if (mnemonicType) {
        if (mnemonicType === 'ton') {
            if (!(await validateStandardTonMnemonic(mnemonic))) {
                throw new Error('Invalid mnemonic type: ton');
            }

            return mnemonicToPrivateKey(mnemonic);
        }

        if (mnemonicType === 'bip39') {
            if (!(await validateBip39Mnemonic(mnemonic))) {
                throw new Error('Invalid mnemonic type: bip39');
            }

            return bip39ToPrivateKey(mnemonic);
        }

        assertUnreachable(mnemonicType);
    }

    if (await validateStandardTonMnemonic(mnemonic)) {
        return mnemonicToPrivateKey(mnemonic);
    }

    if (validBip39Mnemonic(mnemonic.join(' '))) {
        return bip39ToPrivateKey(mnemonic);
    }

    throw new Error('Invalid mnemonic');
};
