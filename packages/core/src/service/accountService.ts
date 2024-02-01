import { AccountState, defaultAccountState } from '../entries/account';
import { AuthState } from '../entries/password';
import { WalletState } from '../entries/wallet';
import { AppKey } from '../Keys';
import { IStorage } from '../Storage';
import { encrypt } from './cryptoService';
import { getWalletMnemonic, validateWalletMnemonic } from './mnemonicService';

export const getAccountState = async (storage: IStorage) => {
    const state = await storage.get<AccountState>(AppKey.ACCOUNT);
    return state ?? defaultAccountState;
};

const accountAppendWallet = async (account: AccountState, publicKey: string) => {
    return {
        publicKeys: account.publicKeys.includes(publicKey)
            ? account.publicKeys
            : account.publicKeys.concat([publicKey]),
        activePublicKey: publicKey
    };
};

export const addWalletWithCustomAuthState = async (storage: IStorage, state: WalletState) => {
    const account = await getAccountState(storage);
    const updatedAccount = await accountAppendWallet(account, state.publicKey);

    const name = account.publicKeys.includes(state.publicKey) ? undefined : state.name;

    if (!('auth' in state)) {
        throw new Error('Missing wallet auth state.');
    }

    await storage.setBatch({
        [AppKey.ACCOUNT]: updatedAccount,
        [`${AppKey.WALLET}_${state.publicKey}`]: { ...state, name }
    });
};

export const addWalletWithGlobalAuthState = async (
    storage: IStorage,
    state: WalletState,
    auth: AuthState,
    encryptedMnemonic?: string
) => {
    const account = await getAccountState(storage);
    const updatedAccount = await accountAppendWallet(account, state.publicKey);
    if (account.publicKeys.includes(state.publicKey)) {
        await storage.setBatch({
            [AppKey.ACCOUNT]: updatedAccount,
            [AppKey.GLOBAL_AUTH_STATE]: auth,
            [`${AppKey.WALLET}_${state.publicKey}`]: { ...state, name: undefined }
        });
    } else {
        const data = {
            [AppKey.ACCOUNT]: updatedAccount,
            [AppKey.GLOBAL_AUTH_STATE]: auth,
            [`${AppKey.WALLET}_${state.publicKey}`]: state
        };

        if (encryptedMnemonic) {
            Object.assign(data, { [`${AppKey.MNEMONIC}_${state.publicKey}`]: encryptedMnemonic });
        }

        await storage.setBatch(data);
    }
};

export const accountSelectWallet = async (storage: IStorage, publicKey: string) => {
    const account = await getAccountState(storage);
    const updated = {
        publicKeys: account.publicKeys,
        activePublicKey: publicKey
    };
    await storage.set(AppKey.ACCOUNT, updated);
};

export const accountLogOutWallet = async (
    storage: IStorage,
    publicKey: string,
    removeRemove = false
) => {
    if (removeRemove) {
        //await deleteWalletBackup(tonApi, publicKey);
    }

    const account = await getAccountState(storage);

    const publicKeys = account.publicKeys.filter(key => key !== publicKey);
    const updatedAccount = {
        publicKeys,
        activePublicKey: publicKeys.length > 0 ? publicKeys[0] : undefined
    };

    if (updatedAccount.publicKeys.length === 0) {
        await storage.setBatch({
            [AppKey.ACCOUNT]: null,
            [AppKey.GLOBAL_AUTH_STATE]: null,
            [`${AppKey.WALLET}_${publicKey}`]: null,
            [`${AppKey.MNEMONIC}_${publicKey}`]: null
        });
    } else {
        await storage.setBatch({
            [AppKey.ACCOUNT]: updatedAccount,
            [`${AppKey.WALLET}_${publicKey}`]: null,
            [`${AppKey.MNEMONIC}_${publicKey}`]: null
        });
    }
};

export const accountChangePassword = async (
    storage: IStorage,
    options: { old: string; password: string; confirm: string }
) => {
    const account = await getAccountState(storage);

    const isValid = await validateWalletMnemonic(storage, account.publicKeys[0], options.old);
    if (!isValid) {
        return 'invalid-old';
    }
    const error = accountValidatePassword(options.password, options.confirm);
    if (error) {
        return error;
    }

    const updated = {} as Record<string, string>;
    for (const publicKey of account.publicKeys) {
        const mnemonic = await getWalletMnemonic(storage, publicKey, options.old);
        updated[`${AppKey.MNEMONIC}_${publicKey}`] = await encrypt(
            mnemonic.join(' '),
            options.password
        );
    }
    await storage.setBatch(updated);
};

export const MinPasswordLength = 6;

export const accountValidatePassword = (password: string, confirm: string) => {
    if (password.length < MinPasswordLength) {
        return 'invalid-password';
    }
    if (password !== confirm) {
        return 'invalid-confirm';
    }
    return undefined;
};
