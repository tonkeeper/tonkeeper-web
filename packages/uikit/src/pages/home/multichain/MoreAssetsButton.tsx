import { FC, ReactNode } from 'react';
import { useTranslation } from '../../../hooks/translation';

import { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';

import { useIsSkeleton } from '../../../primitives';
import { cn } from '../../../libs/css';
import { networkIcon, parseAssetIdHead } from './multichain-utils';
import { TokenImage } from './TokenImage';

const ChevronDown16 = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-textSecondary">
        <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

/**
 * Last-row "More assets" button shown when the portfolio holds more rows
 * than the collapsed list renders. Mirrors iOS
 * `WalletBalanceMultichainAssetsListView.moreAssets`: left avatar stack
 * previews the next rows, right side has the label + chevron. Tap expands
 * the list to show every row; expansion state is owned by the parent and
 * resets on remount per spec.
 */
export const MoreAssetsButton: FC<{
    /** Avatars of the hidden rows — up to the first 2 are stacked. */
    previews: ReactNode[];
    onClick: () => void;
}> = ({ previews, onClick }) => {
    const { t } = useTranslation();
    const isSkeleton = useIsSkeleton();

    return (
        <button
            type="button"
            onClick={onClick}
            // A masked row stands in for rows that don't exist yet; expanding
            // it would unfold the placeholder list.
            disabled={isSkeleton}
            className={cn(
                'flex w-full items-center gap-3 px-4 py-3 text-left',
                !isSkeleton &&
                    'cursor-pointer transition-colors duration-100 hover:bg-backgroundContentTint'
            )}
        >
            <div className="flex h-11 items-center">
                <AvatarStack previews={previews.slice(0, 2)} />
            </div>
            <div className="flex-1 text-label1 text-textPrimary">{t('wallet_more_assets')}</div>
            <ChevronDown16 />
        </button>
    );
};

/**
 * Each avatar overlaps the one before it by 12px and sits on top of it in
 * DOM order. The 2px gap between neighbours is a transparent cutout masked
 * out of the avatar underneath, not a painted ring, so the row's hover tint
 * shows through unchanged.
 */
const AvatarStack: FC<{ previews: ReactNode[] }> = ({ previews }) => {
    if (previews.length === 0) return null;
    return (
        <div className="flex">
            {previews.map((preview, idx) => (
                <div
                    key={idx}
                    className="-ml-3 flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-backgroundContent first:ml-0 [&:not(:last-child)]:[mask-image:radial-gradient(circle_at_calc(100%+2px)_50%,transparent_15.5px,black_16px)] [&>svg]:h-7 [&>svg]:w-7"
                >
                    {preview}
                </div>
            ))}
        </div>
    );
};

/** Token-row avatar for the preview stack. */
export const MoreAssetsAssetAvatar: FC<{ asset: MultichainWalletAsset }> = ({ asset }) => {
    const { network } = parseAssetIdHead(asset.assetId);
    return <TokenImage src={asset.image} fallback={networkIcon(network)} className="h-7 w-7" />;
};
