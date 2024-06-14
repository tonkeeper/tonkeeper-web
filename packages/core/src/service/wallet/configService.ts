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
    trustedNfts: []
};

export const getActiveWalletConfig = async (
    storage: IStorage,
    address: string,
    network: Network | undefined
) => {
    const raw = Address.parse(address).toRawString();
    const config = await storage.get<ActiveWalletConfig>(
        `${AppKey.WALLET_CONFIG}_${raw}_${network}`
    );

    if (!config) {
        return defaultConfig;
    }
    return Object.assign(defaultConfig, config);
};

export const setActiveWalletConfig = async (
    storage: IStorage,
    address: string,
    network: Network | undefined,
    config: ActiveWalletConfig
) => {
    const raw = Address.parse(address).toRawString();
    await storage.set(`${AppKey.WALLET_CONFIG}_${raw}_${network}`, config);
};
