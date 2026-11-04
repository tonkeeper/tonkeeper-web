import { useMemo } from 'react';
import { AccountMultichain } from '@tonkeeper/core/dist/entries/account';
import type { ChainId } from '@tonkeeper/core/dist/chains/types';
import { useActiveAccount } from '../wallet';

const NON_EVM_PREFIXES: Record<string, ChainId> = {
    ton: 'ton',
    btc: 'btc',
    tron: 'tron',
    sol: 'sol',
    solana: 'sol'
};

/**
 * Map the leading segment of an on-ramp `assetId` (e.g. `ton`, `eth`,
 * `base`, `btc`, `tron`, `bsc`) to the `ChainId` of the wallet that owns
 * the destination address.
 *
 * Non-EVM chains have explicit prefixes; everything else is treated as
 * EVM, since a multichain account's single secp256k1 EVM wallet
 * addresses every EVM L1/L2 with the same `rawAddress`. Chains the
 * account doesn't support (e.g. Cosmos, Ripple) resolve to a ChainId
 * the account won't have a wallet for and the hook returns `undefined`.
 */
const chainIdForPrefix = (prefix: string): ChainId | undefined => {
    if (prefix in NON_EVM_PREFIXES) return NON_EVM_PREFIXES[prefix];
    return 'evm';
};

/**
 * Returns the on-ramp destination address for `assetId`'s chain on the
 * active `AccountMultichain`, or `undefined` if:
 *  - the active account isn't multichain,
 *  - the chain isn't enabled on the account,
 *  - or the `assetId` prefix isn't supported.
 *
 * Use the wider `assetId` (e.g. `eth/mainnet/coin`) rather than the
 * narrow ChainId so callers can pass the raw `OnrampAsset.assetId`
 * field without parsing first.
 */
export const useDestinationAddress = (assetId: string | undefined): string | undefined => {
    const account = useActiveAccount();
    return useMemo(() => {
        if (!assetId) return undefined;
        if (!(account instanceof AccountMultichain)) return undefined;
        const prefix = assetId.split('/')[0];
        if (!prefix) return undefined;
        const chainId = chainIdForPrefix(prefix);
        if (!chainId) return undefined;
        const wallet = account.getWalletByChain(chainId);
        return wallet?.rawAddress;
    }, [account, assetId]);
};
