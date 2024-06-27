import { Address } from '@ton/core';
import { AppKey } from '../../Keys';
import { IStorage } from '../../Storage';
import { Network } from '../../entries/network';
import { ActiveWalletConfig } from '../../entries/wallet';

const defaultConfig: ActiveWalletConfig = {
    pinnedNfts: [],
    hiddenNfts: [],
    pinnedTokens: [],
    hiddenTokens: [],
    trustedNfts: [],
    spamNfts: []
};

export const getActiveWalletConfig = async (
    storage: IStorage,
    address: string,
    network: Network | undefined
) => {
    const formatted = Address.parse(address).toString({ testOnly: network === Network.TESTNET });
    const config = await storage.get<ActiveWalletConfig>(`${AppKey.WALLET_CONFIG}_${formatted}`);

    if (!config) {
        return defaultConfig;
    }
    return { ...defaultConfig, ...config };
};

export const setActiveWalletConfig = async (
    storage: IStorage,
    address: string,
    network: Network | undefined,
    config: ActiveWalletConfig
) => {
    const formatted = Address.parse(address).toString({ testOnly: network === Network.TESTNET });
    await storage.set(`${AppKey.WALLET_CONFIG}_${formatted}`, config);
};
