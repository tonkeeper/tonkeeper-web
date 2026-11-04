import { useMemo } from 'react';

import { AnalyticsEvent } from '@tonkeeper/core/dist/analytics';
import { normalizeAnalyticsAssetId } from '@tonkeeper/core/dist/analytics/asset-id';

import { useAnalyticsTrack } from './index';

type TradeStartedEvent = Extract<AnalyticsEvent, { eventName: 'trade_started' }>;
type TradeFavoriteRemoveEvent = Extract<AnalyticsEvent, { eventName: 'trade_favorite_remove' }>;

export type TradeSource = TradeStartedEvent['from'];

/**
 * The Trade tab is one flow whatever opened it: like the native apps, events
 * raised inside it report the tab, and only `trade_started` tells a deeplink
 * entry apart.
 */
export const TRADE_TAB_SOURCE: TradeSource = 'tab_bar';

/** Trading-backend Asset IDs, restated in the form analytics joins on. */
export const useTradeAnalytics = () => {
    const track = useAnalyticsTrack();

    return useMemo(
        () => ({
            started: (from: TradeSource) => track({ eventName: 'trade_started', from }),
            search: (from: TradeSource, query: string | undefined) =>
                track({ eventName: 'trade_search', from, query }),
            searchClick: (from: TradeSource, query: string | undefined, assetId: string) =>
                track({
                    eventName: 'trade_search_click',
                    from,
                    query,
                    asset: normalizeAnalyticsAssetId(assetId)
                }),
            clickAsset: (from: TradeSource, assetId: string) =>
                track({
                    eventName: 'trade_click_asset',
                    from,
                    asset: normalizeAnalyticsAssetId(assetId)
                }),
            favoriteAdd: (assetId: string) =>
                track({
                    eventName: 'trade_favorite_add',
                    from: 'asset_details',
                    asset: normalizeAnalyticsAssetId(assetId)
                }),
            favoriteRemove: (from: TradeFavoriteRemoveEvent['from'], assetId: string) =>
                track({
                    eventName: 'trade_favorite_remove',
                    from,
                    asset: normalizeAnalyticsAssetId(assetId)
                }),
            favoriteClick: (assetId: string, position: number) =>
                track({
                    eventName: 'trade_favorite_click',
                    asset: normalizeAnalyticsAssetId(assetId),
                    position
                })
        }),
        [track]
    );
};
