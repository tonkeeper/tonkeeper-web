import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ChainId } from '@tonkeeper/core/dist/chains/types';
import { MULTICHAIN_NETWORKS_BY_CHAIN } from '@tonkeeper/core/dist/chains/multichain-chain-order';
import {
    formatMultichainAddress,
    MultichainChain
} from '@tonkeeper/core/dist/service/multichainActivityService';
import {
    MultichainFavorite,
    getMultichainFavorites,
    setMultichainFavorites
} from '@tonkeeper/core/dist/service/multichainFavoritesService';

import { useAppSdk } from '../../hooks/appSdk';
import { QueryKey } from '../../libs/queryKey';
import { useActiveAccount } from '../wallet';
import { useMultichainActivity } from './useMultichainActivity';

const sameAddress = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/**
 * Favorites are compared and shown in the chain's display form (friendly
 * `UQ…` for TON), whatever form the user originally typed or the backend
 * reported.
 */
const canonicalFavorite = (favorite: MultichainFavorite): MultichainFavorite => ({
    ...favorite,
    address: formatMultichainAddress(favorite.address, favorite.chain)
});

const validateName = (name: string) => {
    name = name.trim();
    if (name.length < 1 || name.length > 24) {
        throw new Error('Invalid favorite name');
    }
    return name;
};

const useActiveMultichainAccountId = () => {
    const account = useActiveAccount();
    return account.type === 'multichain' ? account.id : undefined;
};

export const useMultichainFavorites = (chain?: ChainId) => {
    const sdk = useAppSdk();
    const accountId = useActiveMultichainAccountId();

    return useQuery<MultichainFavorite[], Error>(
        [QueryKey.multichainFavorites, accountId],
        () => getMultichainFavorites(sdk.storage, accountId!),
        {
            enabled: accountId !== undefined,
            select: items =>
                (chain ? items.filter(i => i.chain === chain) : items).map(canonicalFavorite)
        }
    );
};

export const useAddMultichainFavorite = () => {
    const sdk = useAppSdk();
    const accountId = useActiveMultichainAccountId();
    const client = useQueryClient();

    return useMutation<void, Error, MultichainFavorite>(async favorite => {
        const name = validateName(favorite.name);
        const next = canonicalFavorite({ ...favorite, name });
        const items = await getMultichainFavorites(sdk.storage, accountId!);
        const rest = items.filter(i => !sameAddress(canonicalFavorite(i).address, next.address));
        await setMultichainFavorites(sdk.storage, accountId!, [...rest, next]);
        await client.invalidateQueries([QueryKey.multichainFavorites, accountId]);
    });
};

export const useDeleteMultichainFavorite = () => {
    const sdk = useAppSdk();
    const accountId = useActiveMultichainAccountId();
    const client = useQueryClient();

    return useMutation<void, Error, { address: string; chain: ChainId }>(
        async ({ address, chain }) => {
            const target = formatMultichainAddress(address, chain);
            const items = await getMultichainFavorites(sdk.storage, accountId!);
            await setMultichainFavorites(
                sdk.storage,
                accountId!,
                items.filter(i => !sameAddress(canonicalFavorite(i).address, target))
            );
            await client.invalidateQueries([QueryKey.multichainFavorites, accountId]);
        }
    );
};

export interface RecentRecipient {
    address: string;
    timestamp: number;
}

const MAX_RECENTS = 5;

/**
 * Latest outgoing-transfer recipients on the given chain family, newest
 * first, deduplicated by address and in the chain's display form (the
 * backend reports TON recipients raw). Derived from the first page of the
 * cross-chain activity feed — the same cache the history screens use.
 */
export const useMultichainRecentRecipients = (chain: ChainId) => {
    const { data, isLoading } = useMultichainActivity({ activityType: 'send' });

    const recents = useMemo<RecentRecipient[]>(() => {
        const family: readonly MultichainChain[] = MULTICHAIN_NETWORKS_BY_CHAIN[chain];
        const activities = data?.pages[0]?.activities ?? [];
        const list: RecentRecipient[] = [];
        for (const activity of activities) {
            if (activity.direction !== 'out' || !activity.toAddress) continue;
            if (!family.includes(activity.toChain)) continue;
            const address = formatMultichainAddress(activity.toAddress, activity.toChain);
            if (list.some(item => sameAddress(item.address, address))) continue;
            list.push({ address, timestamp: activity.blockTimeMs });
            if (list.length >= MAX_RECENTS) break;
        }
        return list;
    }, [data, chain]);

    return { recents, isLoading };
};
