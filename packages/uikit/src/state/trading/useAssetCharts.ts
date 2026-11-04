import { useQuery } from '@tanstack/react-query';

import {
    ChartPoint,
    ChartPriceChange,
    chartPriceChange,
    getAssetCharts
} from '@tonkeeper/core/dist/service/tradingService';

import { QueryKey } from '../../libs/queryKey';
import { useUserFiat } from '../fiat';

export type ChartPeriod = 'H' | 'D' | 'W' | 'M' | '6M' | 'Y';

/**
 * Window length in seconds per selector period. Like iOS, we send only the
 * window and let the server pick the point density — it caps at 200 points
 * and rejects an explicit `points_count` above that.
 */
const PERIOD_DURATION_SEC: Record<ChartPeriod, number> = {
    H: 60 * 60,
    D: 24 * 60 * 60,
    W: 7 * 24 * 60 * 60,
    M: 30 * 24 * 60 * 60,
    '6M': 6 * 30 * 24 * 60 * 60,
    Y: 365 * 24 * 60 * 60
};

/**
 * A chart point under the user's cursor / finger, enriched with the diff
 * against the first point of the loaded period — the same math iOS uses
 * for its scrub readout.
 */
export interface ChartScrubPoint extends ChartPriceChange {
    timestamp: number;
    price: number;
}

/**
 * The whole window's move, first point to last — what the hero shows while
 * nothing is scrubbed. Carries its own period so a stale window kept on
 * screen during a period switch is labelled with the period it covers.
 */
export interface ChartPeriodChange extends ChartPriceChange {
    period: ChartPeriod;
    price: number;
}

export interface AssetChartsData {
    points: ChartPoint[];
    /** Absent when the window has no points. */
    periodChange?: ChartPeriodChange;
    /** Min price in the window — useful for axis-label rendering. */
    minPrice?: number;
    /** Max price in the window. */
    maxPrice?: number;
}

export const useAssetCharts = (assetId: string, period: ChartPeriod) => {
    const fiat = useUserFiat();

    return useQuery<AssetChartsData, Error>(
        [QueryKey.tradingAssetCharts, assetId, period, fiat],
        async () => {
            const endDate = Math.floor(Date.now() / 1000);
            const startDate = endDate - PERIOD_DURATION_SEC[period];
            const points = await getAssetCharts({
                assetId,
                currency: fiat,
                startDate,
                endDate
            });
            if (points.length === 0) {
                return { points: [] };
            }

            const last = points[points.length - 1];
            const periodChange: ChartPeriodChange = {
                period,
                price: last.price,
                ...chartPriceChange(points[0], last)
            };

            let minPrice = points[0].price;
            let maxPrice = points[0].price;
            for (const p of points) {
                if (p.price < minPrice) minPrice = p.price;
                if (p.price > maxPrice) maxPrice = p.price;
            }
            return { points, periodChange, minPrice, maxPrice };
        },
        {
            enabled: !!assetId,
            refetchOnWindowFocus: false,
            keepPreviousData: true,
            retry: false
        }
    );
};
