import { FC, useState } from 'react';

import { useTranslation } from '../../../../hooks/translation';
import { TRADE_TAB_SOURCE, useTradeAnalytics } from '../../../../hooks/analytics/trade';
import IcEllipsis16 from '../../../../icons/components/IcEllipsis16';
import { ListTitle } from '../ListTitle';
import {
    useMutateTradingFavorites,
    useTradingFavorites,
    useTradingFavoritesMarketData
} from '../../../../state/trading/useTradingFavorites';
import { TradeFavoriteCard } from './TradeFavoriteCard';

/**
 * "Favorite tokens" rail on the Trade tab (Figma 5872:279715 /
 * 5872:280200): horizontally scrolling favorite cards. The "…" control
 * enters edit mode — the title switches to "Edit favorite tokens", cards
 * grow remove badges and "Done" exits. Hidden entirely while the user has
 * no favorites.
 */
export const TradeFavoritesSection: FC = () => {
    const { t } = useTranslation();
    const favorites = useTradingFavorites();
    const { byId: market, isLoading: marketLoading } = useTradingFavoritesMarketData();
    const { mutate: saveFavorites } = useMutateTradingFavorites();
    const [editing, setEditing] = useState(false);
    const tradeAnalytics = useTradeAnalytics();

    if (favorites.length === 0) return null;

    return (
        <section>
            <ListTitle
                title={editing ? t('trade_favorites_edit_title') : t('trade_favorite_tokens')}
                right={
                    editing ? (
                        <button
                            type="button"
                            onClick={() => setEditing(false)}
                            className="cursor-pointer text-label2 text-textAccent transition-colors duration-100 hover:text-textPrimary"
                        >
                            {t('trade_favorites_done')}
                        </button>
                    ) : (
                        <button
                            type="button"
                            aria-label={t('trade_favorites_edit')}
                            onClick={() => setEditing(true)}
                            className="cursor-pointer px-1 text-iconSecondary transition-colors duration-100 hover:text-iconPrimary"
                        >
                            <IcEllipsis16 className="size-4" />
                        </button>
                    )
                }
            />
            <div className="flex gap-2 overflow-x-auto pb-1 pt-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {favorites.map((stub, position) => (
                    <TradeFavoriteCard
                        key={stub.assetId}
                        stub={stub}
                        market={market.get(stub.assetId)}
                        marketLoading={marketLoading}
                        editing={editing}
                        onOpen={() => {
                            tradeAnalytics.favoriteClick(stub.assetId, position);
                            tradeAnalytics.clickAsset(TRADE_TAB_SOURCE, stub.assetId);
                        }}
                        onRemove={() => {
                            tradeAnalytics.favoriteRemove('favorites_section', stub.assetId);
                            saveFavorites(favorites.filter(f => f.assetId !== stub.assetId));
                        }}
                    />
                ))}
            </div>
        </section>
    );
};
