import { FC } from 'react';

import { NFT } from '@tonkeeper/core/dist/entries/nft';

import { cn } from '../../../../libs/css';
import { useIsSkeleton, useSkeletonMask } from '../../../../primitives';
import IcSaleBadge16 from '../../../../icons/components/IcSaleBadge16';

export interface NftCardSmallProps {
    nft: NFT;
    onClick?: () => void;
    className?: string;
}

export const NftCardSmall: FC<NftCardSmallProps> = ({ nft, onClick, className }) => {
    const isSkeleton = useIsSkeleton();
    const mask = useSkeletonMask();
    const image =
        nft.previews?.find(p => p.resolution === '500x500')?.url ?? nft.previews?.[0]?.url;

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={isSkeleton}
            className={cn(
                'flex flex-col overflow-hidden rounded-medium bg-backgroundContent text-left transition-[background-color,transform] duration-150 ease-out [--tk-skeleton-fill:var(--tk-background-content-tint)]',
                !isSkeleton &&
                    'hover:scale-[1.03] hover:bg-backgroundContentTint active:scale-[0.98]',
                className
            )}
        >
            <div className="relative aspect-square w-full bg-backgroundContentTint">
                {!isSkeleton && image && (
                    <img
                        src={image}
                        alt={nft.metadata?.name ?? ''}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                )}
                {!isSkeleton && nft.sale !== undefined && (
                    <IcSaleBadge16 className="absolute right-2 top-2 size-4 text-constantWhite drop-shadow-[0_2px_6px_rgba(0,0,0,0.08)]" />
                )}
            </div>
            <div className="flex w-full min-w-0 flex-col px-3 py-2">
                <div {...mask({ w: 65 })} className="truncate text-label2 text-textPrimary">
                    {nft.metadata?.name ?? nft.address}
                </div>
                <div {...mask({ w: 90 })} className="h-4 truncate text-body3 text-textSecondary">
                    {nft.collection?.name ?? ''}
                </div>
            </div>
        </button>
    );
};
