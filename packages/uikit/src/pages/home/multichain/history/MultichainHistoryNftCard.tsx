import { FC } from 'react';

import { NftItem } from '@tonkeeper/core/dist/tonApiV2';
import {
    MultichainActivity,
    MultichainActivityAsset
} from '@tonkeeper/core/dist/service/multichainActivityService';

import { cn } from '../../../../libs/css';
import { useTranslation } from '../../../../hooks/translation';
import IcVerification16 from '../../../../icons/components/IcVerification16';
import { useIsSpamNft, useNftItemData } from '../../../../state/nft';
import { historyNftAddress } from './multichain-history-utils';

/**
 * Resolve the TON NFT item behind an activity through tonapi. The
 * multichain API returns NFTs as a bare `AssetInfo` — no item name,
 * collection, artwork or trust — and a domain renewal only as the item's
 * address, so rows and details enrich them the same way the legacy TON
 * history does, cached per item address. Returns `undefined` until
 * resolved and for spam/blacklisted items, in which case callers keep the
 * generic token rendering.
 */
export const useHistoryNft = (
    activity: MultichainActivity | undefined,
    token: MultichainActivityAsset | undefined
): NftItem | undefined => {
    const address = historyNftAddress(activity, token);
    const { data: nft } = useNftItemData(address);
    const spam = useIsSpamNft(nft);
    if (!address || !nft || spam) return undefined;
    return nft;
};

export const nftPreviewUrl = (
    nft: NftItem,
    resolution: '100x100' | '500x500' = '100x100'
): string | undefined =>
    nft.previews?.find(p => p.resolution === resolution)?.url ?? nft.previews?.[0]?.url;

export const NftCollectionLine: FC<{ nft: NftItem; className?: string }> = ({ nft, className }) => {
    const { t } = useTranslation();
    return (
        <span className={cn('flex min-w-0 items-center gap-1', className)}>
            <span className="truncate">
                {nft.collection?.name || t('multichain_history_nft_unnamed_collection')}
            </span>
            {nft.trust === 'whitelist' && (
                <IcVerification16 className="size-4 shrink-0 text-iconSecondary" />
            )}
        </span>
    );
};

/** Compact artwork + name + collection preview shown inside a history row. */
export const MultichainHistoryNftCard: FC<{ nft: NftItem; className?: string }> = ({
    nft,
    className
}) => {
    const image = nftPreviewUrl(nft);
    return (
        <div
            className={cn(
                'flex w-fit max-w-full items-center overflow-hidden rounded-xl bg-backgroundContentTint',
                className
            )}
        >
            <div className="size-16 shrink-0 bg-backgroundContentTint">
                {image && (
                    <img src={image} alt="" loading="lazy" className="size-full object-cover" />
                )}
            </div>
            <div className="flex min-w-0 flex-col px-3 py-2">
                <span className="truncate text-label2 text-textPrimary">
                    {nft.dns ?? nft.metadata?.name ?? 'NFT'}
                </span>
                <NftCollectionLine nft={nft} className="text-body3 text-textSecondary" />
            </div>
        </div>
    );
};
