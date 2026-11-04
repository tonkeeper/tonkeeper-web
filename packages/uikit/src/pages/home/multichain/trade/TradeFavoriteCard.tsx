import { FC } from 'react';

import { TradingMarketAsset } from '@tonkeeper/core/dist/service/tradingService';

import { useSkeletonMask } from '../../../../primitives';
import { useOpenAssetPage } from '../asset/useOpenAssetPage';
import IcCloseSmall16 from '../../../../icons/components/IcCloseSmall16';
import { TradingFavoriteStub } from '../../../../state/trading/useTradingFavorites';
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
 * Favorites-rail card (Figma 5872:279718): the shelf grid cell lifted on
 * its own card surface. Renders from the storage stub immediately; live 24h
 * change overlays once the batched market query resolves. Edit mode swaps
 * navigation for the corner remove control.
 */
export const TradeFavoriteCard: FC<{
    stub: TradingFavoriteStub;
    market?: TradingMarketAsset;
    /**
     * The market batch is still in flight: the change line renders as a
     * loading bar so the card keeps its final two-line height instead of
     * growing when the data lands.
     */
    marketLoading?: boolean;
    editing?: boolean;
    onOpen?: () => void;
    onRemove?: () => void;
}> = ({ stub, market, marketLoading = false, editing = false, onOpen, onRemove }) => {
    const openAsset = useOpenAssetPage();
    const { network } = parseAssetIdHead(stub.assetId);
    const badge = isNativeRow(stub.assetId) ? undefined : networkIcon(network);
    const image = market?.image || stub.imageUrl;
    const diff = formatPercentChange(market?.change24hPercent);
    const diffLoading = marketLoading && !market;
    const mask = useSkeletonMask(diffLoading);

    return (
        <div className="relative shrink-0">
            <button
                type="button"
                onClick={
                    editing
                        ? onRemove
                        : () => {
                              onOpen?.();
                              openAsset(stub.assetId, 'trade_screen');
                          }
                }
                className="group flex w-[88px] cursor-pointer flex-col items-center gap-2 rounded-2xl bg-backgroundContent px-1 py-3 transition-colors duration-100 hover:bg-backgroundContentTint [--tk-skeleton-fill:var(--tk-background-content-tint)]"
            >
                <span className="relative inline-block size-14 shrink-0">
                    <TokenImage
                        src={image}
                        fallback={networkIcon(network)}
                        className="size-14 bg-backgroundContentTint"
                    />
                    {badge && (
                        // The badge ring fakes a cut-out in the card background,
                        // so it has to follow the card through the hover.
                        <span className="absolute -bottom-1 -right-1 size-5 overflow-hidden rounded-full bg-backgroundContentTint ring-2 ring-backgroundContent transition-colors duration-100 group-hover:ring-backgroundContentTint [&>svg]:size-5">
                            {badge}
                        </span>
                    )}
                </span>
                <span className="flex w-full min-w-0 flex-col gap-px text-center">
                    <span className="flex max-w-full items-center justify-center gap-1">
                        <span className="min-w-0 truncate text-body3 text-textPrimary">
                            {stub.symbol}
                        </span>
                        {market && <TokenTrustedBadge verification={market.verification} />}
                    </span>
                    {(diff || diffLoading) && (
                        <span
                            {...mask({ w: 28, h: 8 })}
                            className={`text-body3 ${diffColorClass(market?.change24hPercent)}`}
                        >
                            {/* The nbsp keeps the line box at text height while
                                the bar overlays it — an empty span would collapse
                                to the 8px bar and still jump on hydration. */}
                            {diff ?? '\u00A0'}
                        </span>
                    )}
                </span>
            </button>
            {editing && (
                <span className="pointer-events-none absolute -right-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full bg-backgroundContentTint text-textSecondary ring-2 ring-backgroundPage">
                    <IcCloseSmall16 className="size-4" />
                </span>
            )}
        </div>
    );
};
