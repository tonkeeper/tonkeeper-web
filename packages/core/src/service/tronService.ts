import { mnemonicToPrivateKey, hmac_sha512 } from 'ton-crypto';
import { IStorage } from '../Storage';
import { Network } from '../entries/network';
import { TronWalletState, TronWalletStorage, WalletState } from '../entries/wallet';
import { Configuration, TronApi } from '../tronApi';
import { getWalletMnemonic } from './mnemonicService';
import { setWalletState } from './wallet/storeService';
import { ethers, encodeBase58, sha256 } from 'ethers';

const getPrivateKey = async (tonMnemonic: string[]): Promise<string> => {
    // TON-compatible seed
    const pair = await mnemonicToPrivateKey(tonMnemonic);
    const seed = pair.secretKey.slice(0, 32);

    // Sub-protocol derivation for ETH-derived keys:
    // Note that tonweb's definition of hmacSha512 takes in hex-encoded strings
    const tronSeed = await hmac_sha512(/*key*/ seed, /*data*/ 'BIP32');

    // Plug into BIP39 with TRON path m/44'/195'/0'/0/0:
    const TRON_BIP39_PATH_INDEX_0 = "m/44'/195'/0'/0/0";
    const account = ethers.HDNodeWallet.fromSeed(tronSeed).derivePath(TRON_BIP39_PATH_INDEX_0);
    return account.privateKey.slice(2); // note: this is hex-encoded, remove 0x
};

const getOwnerAddress = async (mnemonic: string[]): Promise<string> => {
    const wallet = new ethers.Wallet(await getPrivateKey(mnemonic));
    const tronAddressPayload = '0x' + '41' + wallet.address.slice(2);
    const checkSumTail = sha256(sha256(tronAddressPayload)).slice(2, 10);
    return encodeBase58(tronAddressPayload + checkSumTail);
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
