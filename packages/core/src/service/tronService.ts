import { mnemonicToPrivateKey } from 'ton-crypto';
import { IStorage } from '../Storage';
import { TronWalletState, WalletState } from '../entries/wallet';
import { Configuration, TronApi } from '../tronApi';
import { getWalletMnemonic } from './mnemonicService';
import { setWalletState } from './wallet/storeService';

/**
 * @deprecated
 */
const TronWeb = require('tronweb/dist/TronWeb.js');

const getPrivateKey = async (mnemonic: string[]): Promise<string> => {
  const pair = await mnemonicToPrivateKey(mnemonic);
  return pair.secretKey.slice(0, 32).toString('hex');
};

const getOwnerAddress = async (mnemonic: string[]): Promise<string> => {
  const ownerAddress = TronWeb.address.fromPrivateKey(
    await getPrivateKey(mnemonic)
  );
  return ownerAddress;
};

const getTronWallet = async (
  tronApi: Configuration,
  mnemonic: string[]
): Promise<TronWalletState> => {
  const ownerWalletAddress = await getOwnerAddress(mnemonic);

  const wallet = await new TronApi(tronApi).getWallet({
    ownerAddress: ownerWalletAddress,
  });

  return {
    ownerWalletAddress,
    walletAddress: wallet.address,
  };
};

export const importTronWallet = async (
  storage: IStorage,
  tronApi: Configuration,
  wallet: WalletState,
  password: string
): Promise<TronWalletState> => {
  const mnemonic = await getWalletMnemonic(storage, wallet.publicKey, password);

  const tron = await getTronWallet(tronApi, mnemonic);

  const updated = { ...wallet, tron };

  await setWalletState(storage, updated);

  return tron;
};
