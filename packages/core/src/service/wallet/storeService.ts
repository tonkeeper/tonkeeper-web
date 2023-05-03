import { AccountState } from '../../entries/account';
import { TonConnectError } from '../../entries/exception';
import { CONNECT_EVENT_ERROR_CODES } from '../../entries/tonConnect';
import { WalletState } from '../../entries/wallet';
import { AppKey } from '../../Keys';
import { IStorage } from '../../Storage';

export const getWalletState = (storage: IStorage, publicKey: string) => {
  return storage.get<WalletState>(`${AppKey.wallet}_${publicKey}`);
};

export const setWalletState = (storage: IStorage, state: WalletState) => {
  return storage.set(`${AppKey.wallet}_${state.publicKey}`, state);
};

export const deleteWalletState = (storage: IStorage, publicKey: string) => {
  return storage.delete(`${AppKey.wallet}_${publicKey}`);
};

export const getCurrentWallet = async (storage: IStorage) => {
  const state = await storage.get<AccountState>(AppKey.account);

  if (!state || !state.activePublicKey) {
    throw new TonConnectError(
      'Missing active wallet',
      CONNECT_EVENT_ERROR_CODES.UNKNOWN_APP_ERROR
    );
  }

  const wallet = await getWalletState(storage, state.activePublicKey);

  if (!wallet) {
    throw new TonConnectError(
      'Missing wallet state',
      CONNECT_EVENT_ERROR_CODES.UNKNOWN_APP_ERROR
    );
  }

  return wallet;
};
