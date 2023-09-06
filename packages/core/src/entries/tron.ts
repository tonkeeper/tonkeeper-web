export enum TronChain {
    MAINNET = '0x2b6653dc',
    NILE = '0xcd8690dc'
}

export const Factories: Record<TronChain, string> = {
    [TronChain.MAINNET]: 'TGnucX7S2MXWkbvUP2cegUAAp2RvmecT6w',
    [TronChain.NILE]: 'TEh65ta2XHgSPXFmqqf9HvaTnQ5AfLzs4x'
};

export const WalletImplementations: Record<TronChain, string> = {
    [TronChain.MAINNET]: 'TTh43zwGx2MNobCce57YYTdoMzYfF5mAAh',
    [TronChain.NILE]: 'TMguz3nmPPVkHa5YxKrQN8dzmXgNMUToDt'
};

export const WalletQueries: Record<TronChain, string> = {
    [TronChain.MAINNET]: 'TYabnyyukhmAzX7EpWnnnxFRu6MS7pmRPV',
    [TronChain.NILE]: 'TTXNRjZKnxGYn3MhF4knP32Gwrg7N8ohvh'
};

export const TronApi: Record<TronChain, string> = {
    [TronChain.MAINNET]: 'https://tron.tonkeeper.com',
    [TronChain.NILE]: 'https://testnet-tron.tonkeeper.com'
};
