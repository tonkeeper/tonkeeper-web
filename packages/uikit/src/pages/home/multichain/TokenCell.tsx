import { FC, ReactNode } from 'react';

import { MultichainAssetVerification } from '@tonkeeper/core/dist/service/multichainWalletService';

import { cn } from '../../../libs/css';
import { ChainBadgeOverlay, useIsSkeleton, useSkeletonMask } from '../../../primitives';
import IcVerification16 from '../../../icons/components/IcVerification16';
import { useTranslation } from '../../../hooks/translation';
import { isNativeRow, networkIcon, parseAssetIdHead } from './multichain-utils';
import { TokenImage } from './TokenImage';

/**
 * The design library's `Cell` for token lists: 44px avatar, two-line center,
 * optional two-line right column or accessory. One implementation for every
 * asset list — home portfolio, catalog, manage, swap and send pickers — so the
 * cell's geometry, typography and loading treatment cannot drift between
 * screens the way the previous per-screen copies did.
 *
 * Loading state is built in: inside a loading `SkeletonScope` the title,
 * subtitle and right value paint as the mockup's bars while chips, secondary
 * values and accessories drop out. Callers keep rendering their placeholder
 * data and never branch on loading themselves.
 */
export interface TokenCellProps {
    icon: ReactNode;
    title: ReactNode;
    /** Chips, verification marks — anything after the title. Hidden while loading. */
    titleExtras?: ReactNode;
    subtitle?: ReactNode;
    /** Right column, first line (balance, price). */
    rightPrimary?: ReactNode;
    /** Right column, second line (fiat value, diff). Hidden while loading. */
    rightSecondary?: ReactNode;
    /** Trailing control (checkmark, toggle). Hidden while loading. */
    accessory?: ReactNode;
    selected?: boolean;
    onClick?: () => void;
    className?: string;
}

export const TokenCell: FC<TokenCellProps> = ({
    icon,
    title,
    titleExtras,
    subtitle,
    rightPrimary,
    rightSecondary,
    accessory,
    selected,
    onClick,
    className
}) => {
    const isSkeleton = useIsSkeleton();
    const mask = useSkeletonMask();

    return (
        <button
            type="button"
            onClick={onClick}
            // Placeholder rows must not fire their callbacks — a masked cell's
            // handler would navigate to (or select) an asset that doesn't exist.
            disabled={isSkeleton}
            aria-current={selected || undefined}
            className={cn(
                'group flex w-full items-center gap-4 px-4 py-4 text-left',
                onClick &&
                    !isSkeleton &&
                    'cursor-pointer transition-colors duration-100 hover:bg-backgroundContentTint',
                className
            )}
        >
            {icon}
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                    <span {...mask({ w: 65 })} className="truncate text-label1 text-textPrimary">
                        {title}
                    </span>
                    {!isSkeleton && titleExtras}
                </div>
                {subtitle !== undefined && (
                    <div {...mask({ w: 170 })} className="truncate text-body2 text-textSecondary">
                        {subtitle}
                    </div>
                )}
            </div>
            {rightPrimary !== undefined && (
                <div className="shrink-0 text-right">
                    <div {...mask({ w: 41 })} className="text-label1 text-textPrimary">
                        {rightPrimary}
                    </div>
                    {!isSkeleton && rightSecondary !== undefined && (
                        <div className="text-body2 text-textSecondary">{rightSecondary}</div>
                    )}
                </div>
            )}
            {!isSkeleton && accessory}
        </button>
    );
};

/**
 * The `Cell Left / Token` avatar recipe shared by the cell's callers: the
 * remote token image falling back to the local chain icon, with the chain
 * badge unless the asset is a native coin — native rows already show the
 * chain as the avatar itself.
 */
export const TokenCellIcon: FC<{ assetId: string; image?: string; className?: string }> = ({
    assetId,
    image,
    className
}) => {
    const isSkeleton = useIsSkeleton();
    const { network } = parseAssetIdHead(assetId);
    const native = isNativeRow(assetId);

    // Always-on contentTint circle behind the image, matching the native
    // apps — token logos with transparent backgrounds and near-background
    // colors would otherwise disappear against the list.
    const token = (
        <TokenImage
            src={image}
            fallback={networkIcon(network)}
            className={className ?? 'size-11 bg-backgroundContentTint'}
        />
    );

    // The loading mockup reduces the avatar to a bare circle — no badge.
    if (native || isSkeleton) return token;
    return <ChainBadgeOverlay icon={networkIcon(network)}>{token}</ChainBadgeOverlay>;
};

/**
 * Checkmark for `titleExtras`. Only `trusted` earns the badge — `whitelist`
 * renders plain, matching the native apps' verification tiers.
 */
export const TokenTrustedBadge: FC<{ verification: MultichainAssetVerification }> = ({
    verification
}) => {
    const { t } = useTranslation();
    if (verification !== 'trusted') return null;
    const label = t('wallet_asset_verified_token');
    return (
        <span role="img" aria-label={label} title={label} className="flex shrink-0 text-accentBlue">
            <IcVerification16 className="size-4" />
        </span>
    );
};

/**
 * Warning label rendered in place of a row's regular subtitle for
 * `none` (unverified) and `blacklist` (scam) assets. Returns `null` for
 * verified tiers so callers can fall back to their normal subtitle.
 */
export const TokenVerificationWarning: FC<{ verification: MultichainAssetVerification }> = ({
    verification
}) => {
    const { t } = useTranslation();
    if (verification === 'none') {
        return <span className="text-accentOrange">{t('wallet_asset_unverified_token')}</span>;
    }
    if (verification === 'blacklist') {
        return <span className="text-accentRed">{t('wallet_asset_scam')}</span>;
    }
    return null;
};
