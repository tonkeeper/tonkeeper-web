import { hmac_sha512, mnemonicToPrivateKey } from '@ton/crypto';
import { ethers } from 'ethers';
import { Network } from '../../entries/network';
import { Factories, TronChain, WalletImplementations } from '../../entries/tron';
import { TronWalletState, TronWalletStorage } from '../../entries/wallet';
import { calculateCreate2 } from './addressCalculation';
import { TronAddress } from './tronUtils';

export const getPrivateKey = async (tonMnemonic: string[]): Promise<string> => {
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
    return TronAddress.hexToBase58(wallet.address);
};

/*export const getTronWallet = async (
    tronApi: Configuration,
    mnemonic: string[],
    wallet: DeprecatedWalletState
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
    wallet: DeprecatedWalletState,
    mnemonic: string[]
): Promise<TronWalletStorage> => {
    const tron = await getTronWallet(tronApi, mnemonic, wallet);

    const updated = { ...wallet, tron };

    //  await setWalletState(storage, updated);

    return tron;
};*/

export const getTronWalletState = (tron: TronWalletStorage, network?: Network): TronWalletState => {
    const chainId = network !== Network.TESTNET ? TronChain.MAINNET : TronChain.NILE;

    if (tron.walletByChain[chainId]) {
        return {
            ownerWalletAddress: tron.ownerWalletAddress,
            chainId: chainId,
            walletAddress: tron.walletByChain[chainId]
        };
    }

    const predictedAddress = calculateCreate2({
        factoryAddress: Factories[chainId],
        ownerAddress: tron.ownerWalletAddress,
        implementationAddress: WalletImplementations[chainId]
    });

    return {
        ownerWalletAddress: tron.ownerWalletAddress,
        chainId: chainId,
        walletAddress: predictedAddress
    };
};
