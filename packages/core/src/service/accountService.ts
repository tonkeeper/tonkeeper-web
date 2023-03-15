import { AccountState, defaultAccountState } from '../entries/account';
import { AuthState } from '../entries/password';
import { AppKey } from '../Keys';
import { IStorage } from '../Storage';
import { Configuration } from '../tonApiV1';
import { encrypt } from './cryptoService';
import {
  deleteWalletMnemonic,
  getWalletMnemonic,
  validateWalletMnemonic,
} from './menmonicService';
import { deleteWalletState, importWallet } from './walletService';

export const getAccountState = async (storage: IStorage) => {
  const state = await storage.get<AccountState>(AppKey.account);
  return state ?? defaultAccountState;
};

const accountAppendWallet = async (
  account: AccountState,
  publicKey: string
) => {
  return {
    publicKeys: account.publicKeys.includes(publicKey)
      ? account.publicKeys
      : account.publicKeys.concat([publicKey]),
    activePublicKey: publicKey,
  };
};

export const accountSetUpWalletState = async (
  storage: IStorage,
  tonApi: Configuration,
  mnemonic: string[],
  auth: AuthState,
  password: string
) => {
  const [encryptedMnemonic, state] = await importWallet(
    tonApi,
    mnemonic,
    password
  );

  const account = await getAccountState(storage);
  const updatedAccount = await accountAppendWallet(account, state.publicKey);
  if (account.publicKeys.includes(state.publicKey)) {
    await storage.setBatch({
      [AppKey.account]: updatedAccount,
      [AppKey.password]: auth,
      [`${AppKey.wallet}_${state.publicKey}`]: { ...state, name: undefined },
    });
  } else {
    await storage.setBatch({
      [AppKey.account]: updatedAccount,
      [AppKey.password]: auth,
      [`${AppKey.wallet}_${state.publicKey}`]: state,
      [`${AppKey.mnemonic}_${state.publicKey}`]: encryptedMnemonic,
    });
  }
};

export const accountSelectWallet = async (
  storage: IStorage,
  publicKey: string
) => {
  const account = await getAccountState(storage);
  const updated = {
    publicKeys: account.publicKeys,
    activePublicKey: publicKey,
  };
  await storage.set(AppKey.account, updated);
};

export const accountLogOutWallet = async (
  storage: IStorage,
  tonApi: Configuration,
  publicKey: string,
  removeRemove: boolean = false
) => {
  if (removeRemove) {
    //await deleteWalletBackup(tonApi, publicKey);
  }

  let account = await getAccountState(storage);

  const publicKeys = account.publicKeys.filter((key) => key !== publicKey);
  account = {
    publicKeys,
    activePublicKey: publicKeys.length > 0 ? publicKeys[0] : undefined,
  };

  await deleteWalletState(storage, publicKey);
  await deleteWalletMnemonic(storage, publicKey);
  if (account.publicKeys.length === 0) {
    await storage.delete(AppKey.password);
  }
  await storage.set(AppKey.account, account);
};

export const accountChangePassword = async (
  storage: IStorage,
  options: { old: string; password: string; confirm: string }
) => {
  let account = await getAccountState(storage);

  const isValid = await validateWalletMnemonic(
    storage,
    account.publicKeys[0],
    options.old
  );
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
    updated[`${AppKey.mnemonic}_${publicKey}`] = await encrypt(
      mnemonic.join(' '),
      options.password
    );
  }
  await storage.setBatch(updated);
};

export const accountValidatePassword = (password: string, confirm: string) => {
  if (password.length < 5) {
    return 'invalid-password';
  }
  if (password !== confirm) {
    return 'invalid-confirm';
  }
  return undefined;
};
