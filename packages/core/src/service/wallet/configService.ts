import { Address } from '@ton/core';
import { IAppSdk } from '../../AppSdk';
import { AppKey } from '../../Keys';
import { IStorage } from '../../Storage';
import { Network } from '../../entries/network';
import { TonWalletConfig } from '../../entries/wallet';
import { AccountId } from '../../entries/account';

const defaultWalletConfig: TonWalletConfig = {
    pinnedNfts: [],
    hiddenNfts: [],
    pinnedTokens: [],
    hiddenTokens: [],
    trustedNfts: [],
    spamNfts: [],
    batterySettings: {
        enabledForSwaps: true,
        enabledForTokens: true,
        enabledForNfts: true
    }
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
    sdk: IAppSdk,
    address: string,
    network: Network | undefined
) => {
    const formatted = Address.parse(address).toString({ testOnly: network === Network.TESTNET });
    let config = await sdk.storage.get<TonWalletConfig>(`${AppKey.WALLET_CONFIG}_${formatted}`);

    if (sdk.targetEnv !== 'twa' && !config) {
        config = await migration(sdk.storage, address, network);
    }
    if (!config) {
        return defaultWalletConfig;
    }
    return { ...defaultWalletConfig, ...config };
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

/**
 * Account config is for MAM accounts where each wallet has own config and account itself has own config
 */
export type AccountConfig = {
    enableTron?: boolean;
};

export const defaultAccountConfig = {
    enableTron: true
} satisfies AccountConfig;

const accountStorageKey = (id: AccountId) => `${AppKey.ACCOUNT_CONFIG}_${id}`;

export const getAccountConfig = async (sdk: IAppSdk, id: AccountId) => {
    const config = await sdk.storage.get<AccountConfig>(accountStorageKey(id));

    return { ...defaultAccountConfig, ...config };
};

export const setAccountConfig = async (storage: IStorage, id: AccountId, config: AccountConfig) => {
    await storage.set(accountStorageKey(id), config);
};
