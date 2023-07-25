import { mnemonicToPrivateKey } from 'ton-crypto';
import { IStorage } from '../Storage';
import { Network } from '../entries/network';
import { TronWalletState, TronWalletStorage, WalletState } from '../entries/wallet';
import { Configuration, TronApi } from '../tronApi';
import { getWalletMnemonic } from './mnemonicService';
import { setWalletState } from './wallet/storeService';

/**
 * @deprecated
 */
// TODO заменить на эзерс
// eslint-disable-next-line @typescript-eslint/no-var-requires,import/extensions
const TronWeb = require('tronweb/dist/TronWeb.js');

const getPrivateKey = async (mnemonic: string[]): Promise<string> => {
    const pair = await mnemonicToPrivateKey(mnemonic);
    return pair.secretKey.slice(0, 32).toString('hex');
};

const getOwnerAddress = async (mnemonic: string[]): Promise<string> => {
    const ownerAddress = TronWeb.address.fromPrivateKey(await getPrivateKey(mnemonic));
    return ownerAddress;
};

const getTronWallet = async (
    tronApi: Configuration,
    mnemonic: string[],
    wallet: WalletState
): Promise<TronWalletStorage> => {
    const ownerWalletAddress = await getOwnerAddress(mnemonic);

    const tronWallet = await new TronApi(tronApi).getWallet({
        ownerAddress: ownerWalletAddress
    });

    return {
        ownerWalletAddress,
        walletByChain: {
            ...(wallet.tron?.walletByChain ?? {}),
            [tronWallet.chainId]: tronWallet.address
        }
    };
};

export const importTronWallet = async (
    storage: IStorage,
    tronApi: Configuration,
    wallet: WalletState,
    password: string
): Promise<TronWalletStorage> => {
    const mnemonic = await getWalletMnemonic(storage, wallet.publicKey, password);

    const tron = await getTronWallet(tronApi, mnemonic, wallet);

    const updated = { ...wallet, tron };

    await setWalletState(storage, updated);

    return tron;
};

export const getTronWalletState = async (
    tronApi: Configuration,
    tron: TronWalletStorage,
    network?: Network
): Promise<TronWalletState> => {
    const chainId = network === Network.MAINNET ? '0x2b6653dc' : '0xcd8690dc';

    if (tron.walletByChain[chainId]) {
        return {
            ownerWalletAddress: tron.ownerWalletAddress,
            chainId: chainId,
            walletAddress: tron.walletByChain[chainId]
        };
    }

    const tronWallet = await new TronApi(tronApi).getWallet({
        ownerAddress: tron.ownerWalletAddress
    });

    return {
        ownerWalletAddress: tron.ownerWalletAddress,
        chainId: tronWallet.chainId,
        walletAddress: tronWallet.address
    };
};
