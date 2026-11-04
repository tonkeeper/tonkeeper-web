import { FC, useState } from 'react';

import { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';

import { cn } from '../../../../libs/css';
import { useTranslation } from '../../../../hooks/translation';
import { useTrackAssetButtonClick } from '../../../../hooks/analytics/asset-button-click';
import { MultichainSwapFlow } from '../swap/MultichainSwapFlow';

/**
 * Swap Buy/Sell bar pinned to the bottom of the asset page. Render it only
 * when the asset can be swapped — there is nothing else in it.
 */
export const MultichainAssetActionBar: FC<{
    asset: MultichainWalletAsset;
    hasBalance: boolean;
    compact?: boolean;
    onSwap?: (direction: 'buy' | 'sell') => void;
}> = ({ asset, hasBalance, compact = false, onSwap }) => {
    const { t } = useTranslation();
    const trackButtonClick = useTrackAssetButtonClick();
    const [swapDirection, setSwapDirection] = useState<'buy' | 'sell'>();
    const openSwap = (direction: 'buy' | 'sell') => {
        trackButtonClick(direction, asset.assetId);
        if (onSwap) onSwap(direction);
        else setSwapDirection(direction);
    };

    // Mobile: fixed to the viewport bottom (full-width bar across the screen).
    // Desktop: sticky to the bottom of the 520px content column — the page
    // is the direct scroll child of MultichainDesktopShell's column, so
    // `sticky bottom-0` pins it to the bottom of the column's scroll
    // viewport without leaking under the sidebar. `mt-auto` keeps it at
    // the column's bottom when the page content is shorter than the column.
    //
    // The wrapper is transparent and click-through so the page content stays
    // visible (and tappable) around the floating buttons; only the buttons
    // themselves take pointer events back.
    const position = compact ? 'sticky bottom-0 mt-auto' : 'fixed inset-x-0 bottom-0';
    const buttonClass =
        'pointer-events-auto flex h-14 flex-1 cursor-pointer items-center justify-center rounded-medium bg-buttonPrimaryBackground px-6 text-label1 text-buttonPrimaryForeground transition-colors duration-100 hover:bg-buttonPrimaryBackgroundHighlighted';
    return (
        <div className={cn(position, 'pointer-events-none z-10')}>
            <div
                className={cn(
                    'flex w-full items-center gap-3 pt-4',
                    // Desktop: the buttons are the bar, so they close on the
                    // column's bottom edge — level with the sidebar card —
                    // instead of floating above it.
                    compact ? 'px-4' : 'px-6 pb-4'
                )}
            >
                <button type="button" onClick={() => openSwap('buy')} className={buttonClass}>
                    {t('wallet_buy')}
                </button>
                {hasBalance && (
                    <button type="button" onClick={() => openSwap('sell')} className={buttonClass}>
                        {t('wallet_sell')}
                    </button>
                )}
            </div>
            {/* Home-indicator clearance under the mobile bar; the desktop
                mockup hides it, so the sticky bar closes flush with the
                column's bottom edge like the section nav does. */}
            {!compact && <div className="h-[21px]" />}

            {/* Mounted only once opened — keeps the action bar (and its
                isolated component test) free of the swap flow's data hooks
                until the user actually picks Buy/Sell. Rendered inside a
                pointer-events-auto island so the click-through wrapper
                doesn't swallow its interactions. */}
            {swapDirection && (
                <div className="pointer-events-auto">
                    <MultichainSwapFlow
                        isOpen
                        onClose={() => setSwapDirection(undefined)}
                        initialAssetId={asset.assetId}
                        initialDirection={swapDirection}
                    />
                </div>
            )}
        </div>
    );
};
