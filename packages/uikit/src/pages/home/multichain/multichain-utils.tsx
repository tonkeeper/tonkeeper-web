import { ReactNode } from 'react';

import BigNumber from 'bignumber.js';
import { formatDecimal } from '@tonkeeper/core/dist/utils/numberFormat';
import { TonendpointChainExplorer } from '@tonkeeper/core/dist/tonkeeperApi/tonendpoint';

import IcChainTon20 from '../../../icons/components/IcChainTon20';
import IcChainEth20 from '../../../icons/components/IcChainEth20';
import IcChainBtc20 from '../../../icons/components/IcChainBtc20';
import IcChainBase20 from '../../../icons/components/IcChainBase20';
import IcChainArb20 from '../../../icons/components/IcChainArb20';
import IcChainBsc20 from '../../../icons/components/IcChainBsc20';
import IcChainTron20 from '../../../icons/components/IcChainTron20';

/**
 * Network registry for the multichain portfolio. The backend returns
 * asset IDs in `<network>/<chain-network>/<type>/<address>` form (e.g.
 * `base/mainnet/coin`, `tron/mainnet/trc20/<addr>`). The first segment
 * is the network code we map here.
 *
 * A `coin`-type row renders without a chain chip or chain badge overlay
 * when it is its chain's own primary coin (TON, ETH, BNB, BTC, TRX). L2s
 * such as Base and Arbitrum borrow Ethereum's coin, so their ETH keeps the
 * badge — the same distinction chain-kit's `primaryCoin` draws in the
 * native apps. Tokens always get both.
 *
 * Chain icons are bundled `IcChain*20` components, never URLs: they sit on
 * every row, so they must not load late or fail offline, and a new chain
 * ships with code anyway. The Android and iOS apps bundle theirs too.
 */

interface NetworkInfo {
    label: string;
    icon: ReactNode;
}

export const NETWORK_INFO: Record<string, NetworkInfo> = {
    ton: { label: 'TON', icon: <IcChainTon20 /> },
    eth: { label: 'Ethereum', icon: <IcChainEth20 /> },
    base: { label: 'Base', icon: <IcChainBase20 /> },
    arb: { label: 'Arbitrum', icon: <IcChainArb20 /> },
    bsc: { label: 'BNB Smart Chain', icon: <IcChainBsc20 /> },
    btc: { label: 'Bitcoin', icon: <IcChainBtc20 /> },
    tron: { label: 'Tron', icon: <IcChainTron20 /> }
};

export function parseAssetIdHead(assetId: string): { network: string; type: string } {
    const [network = '', _chain = '', type = ''] = assetId.split('/');
    return { network, type };
}

const BORROWED_COIN_NETWORKS = new Set(['base', 'arb']);

export function isNativeRow(assetId: string): boolean {
    const { network, type } = parseAssetIdHead(assetId);
    return type === 'coin' && !BORROWED_COIN_NETWORKS.has(network);
}

export function networkLabel(networkCode: string): string {
    return NETWORK_INFO[networkCode]?.label ?? networkCode.toUpperCase();
}

export function networkIcon(networkCode: string): ReactNode {
    return NETWORK_INFO[networkCode]?.icon;
}

export interface AssetExplorerLink {
    /** Explorer brand name, for "View on {explorer}" labels. */
    name: string;
    url: string;
}

/**
 * Block-explorer page for an asset, templated from the boot config's
 * `explorers` exactly as iOS does. A token substitutes its contract address
 * into the chain's `token_url`. A native coin has no contract, so only TON
 * links — to the wallet's own account page — while every other coin, and any
 * chain the config doesn't list, returns `undefined` and the caller hides
 * the item.
 */
export function assetExplorerLink(
    assetId: string,
    explorers: TonendpointChainExplorer[],
    tonAccountAddress?: string
): AssetExplorerLink | undefined {
    const [network = '', , type = '', address = ''] = assetId.split('/');
    const explorer = explorers.find(e => e.chain === network);
    if (!explorer) return undefined;
    if (type !== 'coin' && address && explorer.token_url) {
        return {
            name: explorer.name,
            url: explorer.token_url.replace('{token_address}', address)
        };
    }
    if (type === 'coin' && network === 'ton' && tonAccountAddress && explorer.account_url) {
        return {
            name: explorer.name,
            url: explorer.account_url.replace('{account_address}', tonAccountAddress)
        };
    }
    return undefined;
}

/**
 * Reverse lookup for the trading shelves config, whose chain groups carry
 * display names ("Ethereum") while the catalog's `chain` filter expects the
 * network code ("eth"). Unknown names fall through lowercased so new
 * server-side chains degrade to a plausible code instead of breaking.
 */
export function networkCodeFromLabel(label: string): string {
    const entry = Object.entries(NETWORK_INFO).find(
        ([, info]) => info.label.toLowerCase() === label.toLowerCase()
    );
    return entry ? entry[0] : label.toLowerCase();
}

/**
 * Signed percent change as either backend spells it: tonapi sends
 * pre-formatted "+0.06%" / "−1.2%" (U+2212 minus), the trading backend a bare
 * decimal ("-0.12", "7.3").
 */
function parseChangePercent(raw: string | number | undefined): BigNumber | undefined {
    if (raw === undefined || raw === '') return undefined;
    const n = new BigNumber(
        typeof raw === 'number' ? raw : raw.replace(/[%\s+]/g, '').replace('\u2212', '-')
    );
    return n.isFinite() ? n : undefined;
}

/** Colour token for a signed 24h change; zero and unparseable values stay neutral. */
export function diffColorClass(raw: string | number | undefined): string {
    const n = parseChangePercent(raw);
    if (!n || n.isZero()) return 'text-textSecondary';
    return n.isNegative() ? 'text-accentRed' : 'text-accentGreen';
}

/** Price change the way the mockups render it: explicit sign, space-separated, trailing " %". */
export function formatPercentChange(raw: string | number | undefined): string | undefined {
    const n = parseChangePercent(raw);
    if (!n) return undefined;
    return `${n.isNegative() ? '-' : '+'} ${formatDecimal(n.abs())} %`;
}
