import {
  Address,
  WalletContractV3R1,
  WalletContractV3R2,
  WalletContractV4,
} from 'ton';
import { KeyPair, mnemonicToPrivateKey } from 'ton-crypto';
import { WalletAddress, WalletState, WalletVersion } from '../entries/wallet';
import { AppKey } from '../Keys';
import { IStorage } from '../Storage';
import { Configuration, WalletApi } from '../tonApi';
import {
  createWalletBackup,
  deleteWalletBackup,
  getWalletBackup,
  putWalletBackup,
} from './backupService';
import { encrypt } from './cryptoService';
import { getWalletMnemonic } from './menmonicService';
import { createWalletVoucher } from './voucherService';

export const importWallet = async (
  tonApiConfig: Configuration,
  mnemonic: string[],
  password: string,
  name?: string
): Promise<readonly [string, WalletState]> => {
  const encryptedMnemonic = await encrypt(mnemonic.join(' '), password);
  const keyPair = await mnemonicToPrivateKey(mnemonic);

  const voucher = await createWalletVoucher(keyPair);
  const active = await findWalletAddress(tonApiConfig, keyPair);

  const publicKey = keyPair.publicKey.toString('hex');

  if (publicKey === voucher.publicKey) {
    throw new Error('publicKey is the same');
  }

  try {
    const backup = await getWalletBackup(tonApiConfig, publicKey, voucher);
    console.log(backup);
  } catch (e) {
    console.log(e);
  }

  const state: WalletState = {
    publicKey,
    voucher,

    active,

    revision: 0,
    name,
  };
  return [encryptedMnemonic, state] as const;
};

const versionMap: Record<string, WalletVersion> = {
  wallet_v3R1: WalletVersion.v3R1,
  wallet_v3R2: WalletVersion.v3R2,
  wallet_v4R2: WalletVersion.v4R2,
};

const findWalletVersion = (interfaces: string[]): WalletVersion => {
  for (let value of interfaces) {
    if (versionMap[value]) {
      return versionMap[value];
    }
  }
  throw new Error('Unexpected wallet version');
};

const findWalletAddress = async (
  tonApiConfig: Configuration,
  keyPair: KeyPair
) => {
  const result = await new WalletApi(tonApiConfig).findWalletsByPubKey({
    publicKey: keyPair.publicKey.toString('hex'),
  });

  const activeWallet = result.wallets.find((wallet) => {
    if (
      wallet.interfaces.some((value) => Object.keys(versionMap).includes(value))
    ) {
      return wallet.balance > 0 || wallet.status === 'active';
    }
    return false;
  });

  if (activeWallet) {
    const wallet: WalletAddress = {
      rawAddress: activeWallet.address,
      friendlyAddress: Address.parse(activeWallet.address).toString(),
      version: findWalletVersion(activeWallet.interfaces),
    };

    return wallet;
  }

  const contact = WalletContractV4.create({
    workchain: 0,
    publicKey: keyPair.publicKey,
  });
  const wallet: WalletAddress = {
    rawAddress: contact.address.toRawString(),
    friendlyAddress: contact.address.toString(),
    version: WalletVersion.v4R2,
  };

  return wallet;
};

export const getWalletContract = (
  publicKey: Buffer,
  version: WalletVersion
) => {
  switch (version) {
    case WalletVersion.v3R1:
      return WalletContractV3R1.create({
        workchain: 0,
        publicKey,
      });
    case WalletVersion.v3R2:
      return WalletContractV3R2.create({
        workchain: 0,
        publicKey,
      });
    case WalletVersion.v4R2:
      return WalletContractV4.create({
        workchain: 0,
        publicKey,
      });
    default:
      throw new Error('Unexpected version: ');
  }
};
export const getWalletAddress = (
  publicKey: Buffer,
  version: WalletVersion
): WalletAddress => {
  const { address } = getWalletContract(publicKey, version);
  return {
    rawAddress: address.toRawString(),
    friendlyAddress: address.toString(),
    version,
  };
};

export const updateWalletVersion = async (
  storage: IStorage,
  wallet: WalletState,
  version: WalletVersion
) => {
  const updated: WalletState = {
    ...wallet,
    revision: wallet.revision + 1,
    active: getWalletAddress(Buffer.from(wallet.publicKey, 'hex'), version),
  };
  await setWalletState(storage, updated);
};

export const updateWalletProperty = async (
  tonApi: Configuration,
  storage: IStorage,
  wallet: WalletState,
  props: Pick<
    WalletState,
    | 'name'
    | 'hiddenJettons'
    | 'shownJettons'
    | 'orderJettons'
    | 'lang'
    | 'fiat'
    | 'network'
    | 'voucher'
  >
) => {
  const updated: WalletState = {
    ...wallet,
    ...props,
    revision: wallet.revision + 1,
  };
  await setWalletState(storage, updated);

  if (updated.voucher) {
    putWalletBackup(
      tonApi,
      updated.publicKey,
      updated.voucher,
      createWalletBackup(updated)
    );
  }
};

export const getWalletState = (storage: IStorage, publicKey: string) => {
  return storage.get<WalletState>(`${AppKey.wallet}_${publicKey}`);
};

export const setWalletState = (storage: IStorage, state: WalletState) => {
  return storage.set(`${AppKey.wallet}_${state.publicKey}`, state);
};

export const deleteWalletState = (storage: IStorage, publicKey: string) => {
  return storage.delete(`${AppKey.wallet}_${publicKey}`);
};

export const addWalletVoucher = async (
  tonApi: Configuration,
  storage: IStorage,
  wallet: WalletState,
  password: string
) => {
  const mnemonic = await getWalletMnemonic(storage, wallet.publicKey, password);
  const keyPair = await mnemonicToPrivateKey(mnemonic);
  await updateWalletProperty(tonApi, storage, wallet, {
    voucher: await createWalletVoucher(keyPair),
  });
};

export const deleteWalletVoucher = async (
  tonApi: Configuration,
  storage: IStorage,
  wallet: WalletState
) => {
  if (wallet.voucher) {
    try {
      await deleteWalletBackup(tonApi, wallet.publicKey, wallet.voucher);
    } catch (e) {
      console.error(e);
    }
  }
  await updateWalletProperty(tonApi, storage, wallet, {
    voucher: undefined,
  });
};
