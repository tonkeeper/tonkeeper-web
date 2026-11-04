import { ReactNode } from 'react';
import type { ChainId } from '@tonkeeper/core/dist/chains/types';
import { MULTICHAIN_CHAIN_DISPLAY_ORDER } from '@tonkeeper/core/dist/chains/multichain-chain-order';
import type { MultichainChainCode } from '@tonkeeper/core/dist/chains/multichain-chain-order';
import { BRAND_CONFIG } from '@tonkeeper/core/dist/config/brand';
import IcChainTon20 from '../../icons/components/IcChainTon20';
import IcChainEth20 from '../../icons/components/IcChainEth20';
import IcChainBtc20 from '../../icons/components/IcChainBtc20';
import IcChainBase20 from '../../icons/components/IcChainBase20';
import IcChainArb20 from '../../icons/components/IcChainArb20';
import IcChainBsc20 from '../../icons/components/IcChainBsc20';
import IcChainTron20 from '../../icons/components/IcChainTron20';

/**
 * One row per network the user can receive funds on. EVM L1/L2s
 * (Ethereum, BNB Smart Chain, Base, Arbitrum, …) collapse into the single
 * `'evm'` `ChainId` at the account-model layer — every EVM row in
 * the picker shows the same `rawAddress` from `getWalletByChain('evm')`.
 *
 * `nativeSymbol` is the ticker shown in the warning copy on the
 * per-chain QR page ("Send only {{nativeSymbol}} …"). `displayName`
 * is the row label and the "Your {{displayName}} address" title.
 */
export interface ReceiveChain {
    id: MultichainChainCode;
    chainId: ChainId;
    displayName: string;
    nativeSymbol: string;
    icon: ReactNode;
}

const RECEIVE_CHAIN_BY_ID: Record<MultichainChainCode, ReceiveChain> = {
    ton: {
        id: 'ton',
        chainId: 'ton',
        displayName: BRAND_CONFIG.chainName,
        nativeSymbol: BRAND_CONFIG.coinName,
        icon: <IcChainTon20 />
    },
    tron: {
        id: 'tron',
        chainId: 'tron',
        displayName: 'Tron',
        nativeSymbol: 'TRX',
        icon: <IcChainTron20 />
    },
    eth: {
        id: 'eth',
        chainId: 'evm',
        displayName: 'Ethereum',
        nativeSymbol: 'Ether',
        icon: <IcChainEth20 />
    },
    btc: {
        id: 'btc',
        chainId: 'btc',
        displayName: 'Bitcoin',
        nativeSymbol: 'BTC',
        icon: <IcChainBtc20 />
    },
    base: {
        id: 'base',
        chainId: 'evm',
        displayName: 'Base',
        nativeSymbol: 'Ether',
        icon: <IcChainBase20 />
    },
    bsc: {
        id: 'bsc',
        chainId: 'evm',
        displayName: 'BNB Smart Chain',
        nativeSymbol: 'BNB',
        icon: <IcChainBsc20 />
    },
    arb: {
        id: 'arb',
        chainId: 'evm',
        displayName: 'Arbitrum',
        nativeSymbol: 'Ether',
        icon: <IcChainArb20 />
    }
};

export const RECEIVE_CHAINS: ReceiveChain[] = MULTICHAIN_CHAIN_DISPLAY_ORDER.map(
    id => RECEIVE_CHAIN_BY_ID[id]
);

/**
 * Resolves the backend network head of an asset id (`eth/mainnet/coin` →
 * `'eth'`) to its receive row. Networks the picker doesn't list (Polygon,
 * Solana, …) resolve to `undefined`.
 */
export function receiveChainForNetwork(network: string): ReceiveChain | undefined {
    return RECEIVE_CHAINS.find(chain => chain.id === network);
}
