import { FC, ReactNode, useState } from 'react';

import { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';

import type { RampSource } from '../../../hooks/analytics/ramp-flow';
import { cn } from '../../../libs/css';
import { ChainBadgeOverlay } from '../../../primitives';
import {
    isNativeRow,
    networkIcon,
    networkLabel,
    parseAssetIdHead
} from '../../../pages/home/multichain/multichain-utils';

/** State carried across the multichain send flow steps. */
export interface MultichainSendState {
    asset: MultichainWalletAsset;
    toAddress: string;
    /** The name-service domain the user typed, when `toAddress` was resolved from one. */
    toDomain?: string;
    /** Amount in the asset's smallest unit. */
    amount: bigint;
    /** Human-readable amount the user entered, for display on confirm. */
    amountDisplay: string;
    isMax: boolean;
    comment?: string;
    /** Where the send was started; a top-up from the confirm screen reports it as its source. */
    from: RampSource;
}

/**
 * The sent asset's own standard (from the asset-id type segment), for the
 * form's "use a <standard> address" hint: ERC20 / TRC20 / Jetton / BEP20.
 */
export const networkStandardLabel = (assetId: string): string | undefined => {
    const { type } = parseAssetIdHead(assetId);
    switch (type) {
        case 'erc20':
            return 'ERC20';
        case 'bep20':
            return 'BEP20';
        case 'trc20':
            return 'TRC20';
        case 'trc10':
            return 'TRC10';
        case 'jetton':
            return 'Jetton';
        default:
            return undefined;
    }
};

/**
 * Token standard shown under "Network" on the confirm screen — the chain's
 * default standard (ERC20 / BEP20 / TRC20 …), as the native apps label it,
 * rather than the sent asset's own type.
 */
export const networkTokenStandardLabel = (network: string): string | undefined => {
    switch (network) {
        case 'ton':
            return 'TON';
        case 'eth':
        case 'base':
        case 'arb':
            return 'ERC20';
        case 'bsc':
            return 'BEP20';
        case 'tron':
            return 'TRC20';
        case 'btc':
            return 'BTC';
        default:
            return undefined;
    }
};

/** A hex `0x` prefix doesn't count against the head budget — `0x123456…5678`. */
export const truncateAddress = (address: string, head = 6, tail = 4): string => {
    const prefix = /^0x/i.test(address) ? address.slice(0, 2) : '';
    const body = address.slice(prefix.length);
    return body.length <= head + tail + 1
        ? address
        : `${prefix}${body.slice(0, head)}…${body.slice(-tail)}`;
};

/**
 * Token icon for an asset row, mirroring `HomeMultichainAssetRow`: the
 * tonapi `image` URL when present, else the local chain icon. `size` is
 * the icon edge in px.
 */
export const AssetIcon: FC<{
    asset: MultichainWalletAsset;
    size?: number;
    withChainBadge?: boolean;
}> = ({ asset, size = 44, withChainBadge = true }) => {
    const native = isNativeRow(asset.assetId);
    const { network } = parseAssetIdHead(asset.assetId);
    const dim = { height: size, width: size };

    const base =
        asset.image && asset.image.length > 0 ? (
            <img
                src={asset.image}
                alt=""
                style={dim}
                className="rounded-full bg-backgroundContent object-cover"
            />
        ) : (
            <div
                style={dim}
                className="flex items-center justify-center overflow-hidden rounded-full bg-backgroundContent [&>svg]:h-full [&>svg]:w-full"
            >
                {networkIcon(network) ?? null}
            </div>
        );

    if (native || !withChainBadge) return base;
    return <ChainBadgeOverlay icon={networkIcon(network)}>{base}</ChainBadgeOverlay>;
};

/** Small token + chain-badge pair for the form's `TokenSwitch` pill. */
export const tokenSwitchIcons = (
    asset: MultichainWalletAsset
): { icon: ReactNode; chainBadge?: ReactNode } => {
    const native = isNativeRow(asset.assetId);
    const { network } = parseAssetIdHead(asset.assetId);
    const icon =
        asset.image && asset.image.length > 0 ? (
            <img src={asset.image} alt="" />
        ) : (
            networkIcon(network)
        );
    return { icon, chainBadge: native ? undefined : networkIcon(network) };
};

/**
 * Recipient value that reveals the full address on hover (desktop) or tap
 * (touch) — the address is truncated inline to fit the row.
 */
export const RecipientValue: FC<{ address: string }> = ({ address }) => {
    const [open, setOpen] = useState(false);
    return (
        <span className="group relative inline-flex justify-end">
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className="text-label1 text-textPrimary"
            >
                {truncateAddress(address)}
            </button>
            <span
                className={cn(
                    'pointer-events-none absolute bottom-full right-0 z-10 mb-1 w-max max-w-[320px] break-all rounded-medium bg-backgroundContentTint px-3 py-2 text-left text-body3 text-textPrimary opacity-0 shadow-lg transition-opacity group-hover:opacity-100',
                    open && 'opacity-100'
                )}
            >
                {address}
            </span>
        </span>
    );
};

export { networkLabel };
