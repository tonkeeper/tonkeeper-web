import { TonKeychainRoot } from '@ton-keychain/core';
import { keyPairFromSeed, mnemonicToPrivateKey, mnemonicValidate } from '@ton/crypto';
import { AuthPassword } from '../entries/password';
import { decrypt } from './cryptoService';
import { mnemonicToSeed, validateMnemonic } from 'bip39';
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

    const isValidForTrustWallet = validateMnemonic(mnemonic.join(' '));
    if (isValidForTrustWallet) {
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
    const isValidStandardTonMnemonic = await mnemonicValidate(mnemonic);
    if (isValidStandardTonMnemonic) {
        return mnemonicToPrivateKey(mnemonic);
    }

    const seed = await mnemonicToSeed(mnemonic.join(' '));
    const seedContainer = deriveED25519Path(TON_DERIVATION_PATH, seed.toString('hex'));
    return keyPairFromSeed(seedContainer.key);
};
