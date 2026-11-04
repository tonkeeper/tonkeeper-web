import { AccountMultichain } from '../../entries/account';
import { orderMultichainChains } from '../../chains/multichain-chain-order';
import { ChainKitNetwork } from '../chainkit/chainKitClient';
import { WC_EVM_EVENTS, WC_EVM_METHODS, WC_TRON_METHODS } from './wcConstants';

/**
 * Networks reachable over WalletConnect. TON dApps connect via TonConnect
 * instead, and BTC has no dApp ecosystem — matching the native apps'
 * WalletConnect chain set exactly.
 */
export type WalletConnectNetwork = Exclude<ChainKitNetwork, 'ton' | 'btc'>;

const CAIP_CHAIN: Record<WalletConnectNetwork, string> = {
    eth: 'eip155:1',
    base: 'eip155:8453',
    arb: 'eip155:42161',
    bsc: 'eip155:56',
    tron: 'tron:0x2b6653dc'
};

export const WALLET_CONNECT_NETWORKS = orderMultichainChains(
    Object.keys(CAIP_CHAIN) as WalletConnectNetwork[]
);

export const caipChainOf = (network: WalletConnectNetwork): string => CAIP_CHAIN[network];

export const networkOfCaipChain = (caipChain: string): WalletConnectNetwork | undefined =>
    WALLET_CONNECT_NETWORKS.find(network => CAIP_CHAIN[network] === caipChain);

/** Decimal EIP-155 chain id (`1`, `56`, …) as ERC-681 links carry it. */
export const networkOfEip155ChainId = (chainId: number): WalletConnectNetwork | undefined =>
    networkOfCaipChain(`eip155:${chainId}`);

const EVM_NETWORKS = WALLET_CONNECT_NETWORKS.filter(network => network !== 'tron');

/** Hex-encoded EIP-155 chain id (`0x1`) as seen by the injected EVM provider. */
export const evmHexChainIdOf = (network: WalletConnectNetwork): string =>
    `0x${Number(CAIP_CHAIN[network].split(':')[1]).toString(16)}`;

export const networkOfEvmHexChainId = (chainId: string): WalletConnectNetwork | undefined =>
    EVM_NETWORKS.find(network => evmHexChainIdOf(network) === chainId.toLowerCase());

export interface WalletConnectNamespace {
    chains: string[];
    methods: string[];
    events: string[];
    accounts: string[];
}

/**
 * The `supportedNamespaces` record for `buildApprovedNamespaces`,
 * offering every WalletConnect-capable chain the account has a wallet
 * for. One EVM wallet entry serves all eip155 chains — the address is
 * identical across them.
 */
export const buildSupportedNamespaces = (
    account: AccountMultichain
): Record<string, WalletConnectNamespace> => {
    const namespaces: Record<string, WalletConnectNamespace> = {};

    const evmWallet = account.getWalletByChain('evm');
    if (evmWallet && 'rawAddress' in evmWallet) {
        const chains = WALLET_CONNECT_NETWORKS.filter(n => n !== 'tron').map(caipChainOf);
        namespaces.eip155 = {
            chains,
            methods: [...WC_EVM_METHODS],
            events: [...WC_EVM_EVENTS],
            accounts: chains.map(chain => `${chain}:${evmWallet.rawAddress}`)
        };
    }

    const tronWallet = account.getWalletByChain('tron');
    if (tronWallet && 'rawAddress' in tronWallet) {
        const chain = caipChainOf('tron');
        namespaces.tron = {
            chains: [chain],
            methods: [...WC_TRON_METHODS],
            events: [],
            accounts: [`${chain}:${tronWallet.rawAddress}`]
        };
    }

    return namespaces;
};

export interface ProposalNamespacesLike {
    [namespace: string]: { chains?: string[] };
}

/**
 * Network codes a proposal would grant if approved: the dApp's
 * required+optional chains intersected with the chains the account has
 * wallets for, in `WALLET_CONNECT_NETWORKS` order. An empty result means
 * the proposal cannot be approved (`buildApprovedNamespaces` would throw
 * on the unsupported required namespaces).
 */
export const proposalNetworks = (
    proposalParams: {
        requiredNamespaces: ProposalNamespacesLike;
        optionalNamespaces?: ProposalNamespacesLike;
    },
    account: AccountMultichain
): WalletConnectNetwork[] => {
    const requested = new Set(
        [
            ...Object.values(proposalParams.requiredNamespaces),
            ...Object.values(proposalParams.optionalNamespaces ?? {})
        ].flatMap(namespace => namespace.chains ?? [])
    );
    const supported = buildSupportedNamespaces(account);
    const offered = new Set(Object.values(supported).flatMap(namespace => namespace.chains ?? []));
    return WALLET_CONNECT_NETWORKS.filter(network => {
        const chain = caipChainOf(network);
        return requested.has(chain) && offered.has(chain);
    });
};

/**
 * Network codes a session ended up granting, in `WALLET_CONNECT_NETWORKS`
 * order, derived from the approved namespaces' `accounts` entries.
 */
export const sessionNetworks = (namespaces: {
    [namespace: string]: { accounts: string[] };
}): WalletConnectNetwork[] => {
    const granted = new Set<WalletConnectNetwork>();
    for (const namespace of Object.values(namespaces)) {
        for (const account of namespace.accounts) {
            const caipChain = account.split(':').slice(0, 2).join(':');
            const network = networkOfCaipChain(caipChain);
            if (network) {
                granted.add(network);
            }
        }
    }
    return WALLET_CONNECT_NETWORKS.filter(network => granted.has(network));
};
