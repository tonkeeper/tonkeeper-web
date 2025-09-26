import { TonKeychainRoot } from '@ton-keychain/core';
import {
    keyPairFromSeed,
    mnemonicToPrivateKey,
    mnemonicValidate as validateStandardTonMnemonic,
    sha256_sync
} from '@ton/crypto';
import { MnemonicType } from '../entries/password';
import { decrypt, encrypt } from './cryptoService';
import { deriveED25519Path } from './ed25519';
import { assertUnreachable } from '../utils/types';
import { AccountSecret } from '../entries/account';
import nacl from 'tweetnacl';

export const decryptWalletSecret = async (
    encryptedSecret: string,
    password: string
): Promise<AccountSecret> => {
    const secret = await decrypt(encryptedSecret, password);
    return walletSecretFromString(secret);
};

export const walletSecretFromString = async (secret: string): Promise<AccountSecret> => {
    const isValidMnemonic = await seeIfMnemonicValid(secret.split(' '));
    if (isValidMnemonic) {
        return {
            type: 'mnemonic',
            mnemonic: secret.split(' ')
        };
    }

    if (isValidSKOrSeed(secret)) {
        return {
            type: 'sk',
            sk: secret
        };
    }

    throw new Error('Wallet secret not valid');
};

export const walletSecretToString = (secret: AccountSecret): string => {
    if (secret.type === 'mnemonic') {
        return secret.mnemonic.join(' ');
    }

    if (secret.type === 'sk') {
        return secret.sk;
    }

    assertUnreachable(secret);
};

export const encryptWalletSecret = async (
    secret: AccountSecret,
    password: string
): Promise<string> => {
    const stringSecret = walletSecretToString(secret);
    return encrypt(stringSecret, password);
};

export const isValidSK = (sk: string) => {
    return /^[0-9a-fA-F]{128}$/.test(sk);
};

export const isValidSeed = (seed: string) => {
    return /^[0-9a-fA-F]{64}$/.test(seed);
};

export const isValidSKOrSeed = (sk: string) => {
    return isValidSK(sk) || isValidSeed(sk);
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

    if (await validateBip39Mnemonic(mnemonic)) {
        return true;
    }

    return false;
};

export const validateBip39Mnemonic = async (mnemonic: string[]) => {
    const { validateMnemonic: validBip39Mnemonic } = await import('bip39');
    return validBip39Mnemonic(mnemonic.join(' '));
};

async function bip39ToPrivateKey(mnemonic: string[], derivationIndex = 0) {
    const { mnemonicToSeed } = await import('bip39');
    const seed = await mnemonicToSeed(mnemonic.join(' '));
    //const TON_DERIVATION_PATH = `m/44'/607'/${derivationIndex}'`;
    const TON_DERIVATION_PATH = "m/44'/607'/0'"; // TODO:bip39 temporary
    const seedContainer = deriveED25519Path(TON_DERIVATION_PATH, seed.toString('hex'));
    return keyPairFromSeed(seedContainer.key);
}

export const mnemonicToKeypair = async (
    mnemonic: string[],
    mnemonicType?: MnemonicType,
    derivationIndex = 0
) => {
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

            return bip39ToPrivateKey(mnemonic, derivationIndex);
        }

        assertUnreachable(mnemonicType);
    }

    if (await validateStandardTonMnemonic(mnemonic)) {
        return mnemonicToPrivateKey(mnemonic);
    }

    if (await validateBip39Mnemonic(mnemonic)) {
        return bip39ToPrivateKey(mnemonic);
    }

    throw new Error('Invalid mnemonic');
};

export const tonProofSignerByTonMnemonic = (
    mnemonic: string[],
    type: 'ton' | 'bip39',
    derivationIndex = 0
) => {
    return async (bufferToSign: Buffer) => {
        const keyPair = await mnemonicToKeypair(mnemonic, type, derivationIndex);
        return nacl.sign.detached(Buffer.from(sha256_sync(bufferToSign)), keyPair.secretKey);
    };
};
