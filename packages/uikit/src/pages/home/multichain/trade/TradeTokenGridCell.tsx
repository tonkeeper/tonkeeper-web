import { FC } from 'react';

import { TradingMarketAsset } from '@tonkeeper/core/dist/service/tradingService';

import { useIsSkeleton, useSkeletonMask } from '../../../../primitives';
import { cn } from '../../../../libs/css';
import { useOpenAssetPage } from '../asset/useOpenAssetPage';
import { TRADE_TAB_SOURCE, useTradeAnalytics } from '../../../../hooks/analytics/trade';
import {
    diffColorClass,
    formatPercentChange,
    isNativeRow,
    networkIcon,
    parseAssetIdHead
} from '../multichain-utils';
import { TokenImage } from '../TokenImage';
import { TokenTrustedBadge } from '../TokenCell';

/**
 * Shelf grid entry (Figma "Service Card Medium", e.g. 3341:120999): 56px
 * token thumb with a chain badge, symbol and 24h change underneath. Rendered
 * four per row inside `TradeShelfSection`.
 */
export const TradeTokenGridCell: FC<{ asset: TradingMarketAsset }> = ({ asset }) => {
    const openAsset = useOpenAssetPage();
    const tradeAnalytics = useTradeAnalytics();
    const isSkeleton = useIsSkeleton();
    const mask = useSkeletonMask();
    const { network } = parseAssetIdHead(asset.assetId);
    const native = isNativeRow(asset.assetId);
    const badge = native || isSkeleton ? undefined : networkIcon(network);
    const diff = formatPercentChange(asset.change24hPercent);

    return (
        <button
            type="button"
            onClick={() => {
                tradeAnalytics.clickAsset(TRADE_TAB_SOURCE, asset.assetId);
                openAsset(asset.assetId, 'trade_screen');
            }}
            disabled={isSkeleton}
            className={cn(
                'group flex min-w-0 flex-1 flex-col items-center gap-2 rounded-2xl px-0.5 py-2',
                !isSkeleton &&
                    'cursor-pointer transition-colors duration-100 hover:bg-backgroundContentTint'
            )}
        >
            <span className="relative inline-block size-14 shrink-0">
                <TokenImage
                    src={asset.image}
                    fallback={networkIcon(network)}
                    className="size-14 bg-backgroundContentTint"
                />
                {badge && (
                    // The badge ring fakes a cut-out in the cell background, so
                    // it has to follow the cell through the hover.
                    <span className="absolute -bottom-1 -right-1 size-5 overflow-hidden rounded-full bg-backgroundContentTint ring-2 ring-backgroundContent transition-colors duration-100 group-hover:ring-backgroundContentTint [&>svg]:size-5">
                        {badge}
                    </span>
                )}
            </span>
            <span className="flex w-full min-w-0 flex-col items-center gap-px text-center">
                <span className="flex max-w-full items-center gap-1">
                    <span
                        {...mask({ w: 40 })}
                        className="min-w-0 truncate text-body3 text-textPrimary"
                    >
                        {asset.symbol}
                    </span>
                    {!isSkeleton && <TokenTrustedBadge verification={asset.verification} />}
                </span>
                {/* The change line always paints while loading — dropping it
                    would collapse the cell to one line and shift the grid
                    when real data (which always carries a change) lands. */}
                {(diff || isSkeleton) && (
                    <span
                        {...mask({ w: 28, h: 8 })}
                        className={`text-body3 ${diffColorClass(asset.change24hPercent)}`}
                    >
                        {diff ?? '\u00A0'}
                    </span>
                )}
            </span>
        </button>
    );
};
