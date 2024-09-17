import { TonKeychainRoot } from '@ton-keychain/core';
import {
    keyPairFromSeed,
    mnemonicToPrivateKey,
    mnemonicValidate as validateStandardTonMnemonic
} from '@ton/crypto';
import { AuthPassword } from '../entries/password';
import { decrypt } from './cryptoService';
import { mnemonicToSeed, validateMnemonic as validBip39Mnemonic } from 'bip39';
import { deriveED25519Path } from './ed25519';

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
    if (await validateStandardTonMnemonic(mnemonic)) {
        return true;
    }

    if (validBip39Mnemonic(mnemonic.join(' '))) {
        return true;
    }

    try {
        await TonKeychainRoot.fromMnemonic(mnemonic);
        return true;
    } catch (e) {
        return false;
    }
};

const isMamMnemonic = async (mnemonic: string[]) => {
    try {
        await TonKeychainRoot.fromMnemonic(mnemonic);
        return true;
    } catch (e) {
        return false;
    }
};

const TON_DERIVATION_PATH = "m/44'/607'/0'";
export const mnemonicToKeypair = async (mnemonic: string[]) => {
    if (await isMamMnemonic(mnemonic)) {
        throw new Error('Cannot convert MAM mnemonic to keypair');
    }

    if (await validateStandardTonMnemonic(mnemonic)) {
        return mnemonicToPrivateKey(mnemonic);
    }

    if (validBip39Mnemonic(mnemonic.join(' '))) {
        const seed = await mnemonicToSeed(mnemonic.join(' '));
        const seedContainer = deriveED25519Path(TON_DERIVATION_PATH, seed.toString('hex'));
        return keyPairFromSeed(seedContainer.key);
    }

    throw new Error('Invalid mnemonic');
};
