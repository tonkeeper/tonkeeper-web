import { Address } from '@ton/core';
import { AppKey } from '../../Keys';
import { IStorage } from '../../Storage';
import { Network } from '../../entries/network';
import { TonWalletConfig } from '../../entries/wallet';

const defaultConfig: TonWalletConfig = {
    pinnedNfts: [],
    hiddenNfts: [],
    pinnedTokens: [],
    hiddenTokens: [],
    trustedNfts: [],
    spamNfts: []
};

const migration = async (storage: IStorage, address: string, network: Network | undefined) => {
    const raw = Address.parse(address).toRawString();
    const config = await storage.get<TonWalletConfig>(
        `${AppKey.WALLET_CONFIG}_${raw}_${network ?? Network.MAINNET}`
    );
    if (config != null) {
        await setActiveWalletConfig(storage, address, network, config);
    }
    return config;
};

export const getActiveWalletConfig = async (
    storage: IStorage,
    address: string,
    network: Network | undefined
) => {
    const formatted = Address.parse(address).toString({ testOnly: network === Network.TESTNET });
    let config = await storage.get<TonWalletConfig>(`${AppKey.WALLET_CONFIG}_${formatted}`);

    if (!config) {
        config = await migration(storage, address, network);
    }
    if (!config) {
        return defaultConfig;
    }
    return { ...defaultConfig, ...config };
};

export const setActiveWalletConfig = async (
    storage: IStorage,
    address: string,
    network: Network | undefined,
    config: TonWalletConfig
) => {
    const formatted = Address.parse(address).toString({ testOnly: network === Network.TESTNET });
    await storage.set(`${AppKey.WALLET_CONFIG}_${formatted}`, config);
};
