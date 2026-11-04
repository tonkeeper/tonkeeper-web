import { generateMnemonic, mnemonicToSeed } from 'bip39';
import { TonKeychainRoot } from '@ton-keychain/core';
import {
    keyPairFromSeed,
    mnemonicToPrivateKey,
    mnemonicToSeed as tonMnemonicToSeed,
    mnemonicValidate as validateStandardTonMnemonic
} from '@ton/crypto';
import { MnemonicType } from '../entries/password';
import { pathFor } from '../chains/derivation';
import { decrypt, encrypt } from './cryptoService';
import { deriveED25519Path } from './ed25519';
import { assertUnreachable } from '../utils/types';
import { AccountSecret } from '../entries/account';

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

/**
 * BIP-39 → ed25519 keypair using the TON derivation path by default. The
 * `path` arg exists so future TON-multi-account flows can pass an
 * alternate path. EVM / BTC / SOL do **not** route through this helper —
 * they need their own curve (secp256k1 / ed25519-SLIP-0010) — see
 * `chains/derivation.ts` for the path map and the scope warning.
 */
async function bip39ToPrivateKey(mnemonic: string[], path: string = pathFor('ton')) {
    const seed = await mnemonicToSeed(mnemonic.join(' '));
    const seedContainer = deriveED25519Path(path, seed.toString('hex'));

    return keyPairFromSeed(seedContainer.key);
}

async function resolveMnemonicType(mnemonic: string[], type?: MnemonicType): Promise<MnemonicType> {
    if (type) {
        const isValid =
            type === 'ton'
                ? await validateStandardTonMnemonic(mnemonic)
                : await validateBip39Mnemonic(mnemonic);

        if (!isValid) throw new Error('Invalid mnemonic');

        return type;
    }

    if (await validateStandardTonMnemonic(mnemonic)) return 'ton';
    if (await validateBip39Mnemonic(mnemonic)) return 'bip39';

    throw new Error('Invalid mnemonic');
}

export const mnemonicToKeypair = async (mnemonic: string[], mnemonicType?: MnemonicType) => {
    switch (await resolveMnemonicType(mnemonic, mnemonicType)) {
        case 'ton':
            return mnemonicToPrivateKey(mnemonic);
        case 'bip39':
            return bip39ToPrivateKey(mnemonic);
    }
};

const tonMnemonicToEd25519Seed = async (mnemonic: string[]) => {
    const seed = await tonMnemonicToSeed(mnemonic, 'TON default seed');

    return Buffer.from(seed.subarray(0, 32));
};

/**
 * BIP-39 → 32-byte ed25519 seed (used to construct `nacl.sign.keyPair`).
 * Same TON-default contract and same multi-curve caveat as
 * {@link bip39ToPrivateKey}.
 */
const bip39MnemonicToEd25519Seed = async (mnemonic: string[], path: string = pathFor('ton')) => {
    const seed = await mnemonicToSeed(mnemonic.join(' '));
    const seedContainer = deriveED25519Path(path, seed.toString('hex'));

    return Buffer.from(seedContainer.key);
};

export async function mnemonicToEd25519Seed(mnemonic: string[], mnemonicType?: MnemonicType) {
    switch (await resolveMnemonicType(mnemonic, mnemonicType)) {
        case 'ton':
            return tonMnemonicToEd25519Seed(mnemonic);
        case 'bip39':
            return bip39MnemonicToEd25519Seed(mnemonic);
    }
}

/**
 * Generate a fresh BIP39 mnemonic. Surface lives in core so uikit doesn't
 * need to depend on `bip39` directly — the legacy TON create flow only
 * needs `mnemonicNew` from `@ton/crypto`; the multichain create flow
 * needs BIP39 from this helper.
 */
export const generateBip39Mnemonic = (wordsCount: 12 | 24): string[] => {
    const bits = wordsCount === 12 ? 128 : 256;
    return generateMnemonic(bits).split(' ');
};

/**
 * Clean a clipboard string into a list of mnemonic-word candidates.
 *
 * Other wallets paste phrases in a dozen shapes: `1. word`, `1) word`,
 * `#1 word`, `word1, word2`, tab- or newline-separated, NBSP between
 * words, ALL CAPS, etc. The robust rule is "every run of non-letters is
 * a separator" — so we lowercase, collapse any non-`a-z` sequence to a
 * single space, trim, split.
 *
 * Returns `[]` for empty / garbage input (e.g. `"123"`) so the caller
 * can no-op without a special check. Does NOT validate against the
 * BIP39 wordlist — that's the next layer's job.
 */
export const parseMnemonicPaste = (text: string): string[] => {
    return text
        .toLowerCase()
        .replace(/[^a-z]+/g, ' ')
        .trim()
        .split(' ')
        .filter(Boolean);
};
