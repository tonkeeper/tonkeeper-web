import { FC, useEffect, useState } from 'react';

import { AppKey } from '@tonkeeper/core/dist/Keys';

import { cn } from '../../../../libs/css';
import { useAppSdk } from '../../../../hooks/appSdk';
import { useTranslation } from '../../../../hooks/translation';
import { useTradeAnalytics } from '../../../../hooks/analytics/trade';
import IcStar16 from '../../../../icons/components/IcStar16';
import {
    TradingFavoriteStub,
    useToggleTradingFavorite
} from '../../../../state/trading/useTradingFavorites';

/**
 * Header star toggling the asset in the Trade-tab favorites (Figma
 * 5872:280849 — active state tints the star accent-blue; the mockup's
 * Lottie burst is a native-app nicety). First visit shows the one-shot
 * "NEW — Add to favorites" bubble until dismissed by any interaction.
 */
export const MultichainAssetFavoriteButton: FC<{
    stub: Omit<TradingFavoriteStub, 'addedAt'>;
}> = ({ stub }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const { isFavorite, toggle } = useToggleTradingFavorite();
    const tradeAnalytics = useTradeAnalytics();
    const active = isFavorite(stub.assetId);
    const [hintVisible, setHintVisible] = useState(false);

    useEffect(() => {
        let cancelled = false;
        sdk.storage.get<boolean>(AppKey.MULTICHAIN_FAVORITES_HINT_DISMISSED).then(dismissed => {
            if (!cancelled && !dismissed) setHintVisible(true);
        });
        return () => {
            cancelled = true;
        };
    }, [sdk]);

    const dismissHint = () => {
        if (!hintVisible) return;
        setHintVisible(false);
        sdk.storage.set(AppKey.MULTICHAIN_FAVORITES_HINT_DISMISSED, true);
    };

    return (
        <div className="relative">
            <button
                aria-label={t('wallet_asset_add_to_favorites')}
                aria-pressed={active}
                onClick={() => {
                    dismissHint();
                    if (active) tradeAnalytics.favoriteRemove('asset_details', stub.assetId);
                    else tradeAnalytics.favoriteAdd(stub.assetId);
                    toggle(stub);
                }}
                className={cn(
                    'flex h-8 w-8 cursor-pointer items-center justify-center rounded-medium bg-buttonSecondaryBackground transition-colors duration-100 hover:bg-buttonSecondaryBackgroundHighlighted',
                    active ? 'text-textAccent' : 'text-iconTertiary hover:text-iconSecondary'
                )}
            >
                <IcStar16 className="size-4" />
            </button>
            {hintVisible && !active && (
                <button
                    type="button"
                    onClick={dismissHint}
                    className="absolute -right-1 top-full z-30 mt-2 flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-accentBlueConstant px-2 py-1.5"
                >
                    <span className="absolute -top-1 right-4 size-2 rotate-45 bg-accentBlueConstant" />
                    <span className="rounded-md bg-white px-1.5 py-0.5 text-label3 text-accentBlueConstant">
                        {t('wallet_asset_favorites_new_badge')}
                    </span>
                    <span className="text-label2 text-white">
                        {t('wallet_asset_add_to_favorites')}
                    </span>
                </button>
            )}
        </div>
    );
};
