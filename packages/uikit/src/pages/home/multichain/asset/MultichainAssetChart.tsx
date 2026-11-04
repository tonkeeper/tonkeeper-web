import { memo, RefCallback, useCallback, useEffect, useRef, useState } from 'react';
import { Area, AreaChart, Tooltip, XAxis, YAxis } from 'recharts';

import { chartPriceChange } from '@tonkeeper/core/dist/service/tradingService';

import { Button } from '../../../../primitives';
import { useAppContext } from '../../../../hooks/appContext';
import { formatFiatCurrency } from '../../../../hooks/balance';
import { useTranslation } from '../../../../hooks/translation';
import IcRefresh16 from '../../../../icons/components/IcRefresh16';
import { ChartNoDataWave, MultichainAssetChartGhost } from './MultichainAssetChartGhost';
import {
    ChartPeriod,
    ChartScrubPoint,
    useAssetCharts
} from '../../../../state/trading/useAssetCharts';

const CHART_HEIGHT = 240;
const PRICE_LABEL_HEIGHT = 20;
const PLOT_HEIGHT = CHART_HEIGHT - 2 * PRICE_LABEL_HEIGHT;
/** Room for the scrub dot's halo (r 4 + 8 stroke) at the plot's top and bottom edges. */
const PLOT_VERTICAL_INSET = 8;

/**
 * Measure the parent div directly with ResizeObserver instead of
 * relying on Recharts' `ResponsiveContainer`. The latter routinely
 * misses the first stretch pass inside a flex column and leaves the
 * SVG sized 0×0 — labels still render but the line never paints. A
 * direct observer is fewer lines and reliably catches the layout.
 */
function useMeasuredWidth(): [RefCallback<HTMLDivElement>, number] {
    const [element, setElement] = useState<HTMLDivElement | null>(null);
    const [width, setWidth] = useState(0);
    const ref = useCallback<RefCallback<HTMLDivElement>>(node => {
        setElement(node);
    }, []);

    useEffect(() => {
        if (!element) return;

        const el = element;
        const measure = () => setWidth(el.getBoundingClientRect().width);
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        return () => observer.disconnect();
    }, [element]);

    return [ref, width];
}

interface RechartsHoverState {
    activePayload?: { payload: { timestamp: number; price: number } }[];
}

/**
 * Memoized so the parent's scrub-state updates don't redraw the SVG on
 * every pointer move — `onScrub` must stay referentially stable (a
 * `useState` setter qualifies). Recharts throttles hover tracking to
 * 60fps internally, so the readout needs no debounce of its own.
 */
export const MultichainAssetChart = memo(function MultichainAssetChart({
    assetId,
    period,
    onScrub
}: {
    assetId: string;
    period: ChartPeriod;
    /** Fired with the hovered / touched point; `null` on release. */
    onScrub?: (point: ChartScrubPoint | null) => void;
}) {
    const { t } = useTranslation();
    const { fiat } = useAppContext();
    const { data, isFetching, isError, refetch } = useAssetCharts(assetId, period);
    const [ref, width] = useMeasuredWidth();

    const points = data?.points ?? [];
    const minPrice = data?.minPrice;
    const maxPrice = data?.maxPrice;
    const trendColor =
        (data?.periodChange?.diffFiat ?? 0) < 0 ? 'var(--tk-accent-red)' : 'var(--tk-accent-green)';

    // Recharts keeps its internal tooltip state active after a touch ends,
    // so the crosshair and dot are gated on our own `scrubbing` flag instead
    // of the library's — it drops the moment the pointer leaves / lifts.
    const [scrubbing, setScrubbing] = useState(false);

    const onScrubRef = useRef(onScrub);
    onScrubRef.current = onScrub;
    const firstPointRef = useRef(points[0]);
    firstPointRef.current = points[0];

    const handleMove = useCallback((state: RechartsHoverState) => {
        const payload = state?.activePayload?.[0]?.payload;
        const first = firstPointRef.current;
        if (!payload || !first) return;
        setScrubbing(true);
        onScrubRef.current?.({
            timestamp: payload.timestamp,
            price: payload.price,
            ...chartPriceChange(first, payload)
        });
    }, []);

    const handleEnd = useCallback(() => {
        setScrubbing(false);
        onScrubRef.current?.(null);
    }, []);

    // The selection outlives the data it was computed from otherwise —
    // switching period or asset must reset the hero readout.
    useEffect(() => {
        return () => {
            onScrubRef.current?.(null);
        };
    }, [assetId, period]);

    // Lock the container's height with min/max so no flex/parent rule
    // can grow or shrink it. Belt-and-suspenders: arbitrary-px Tailwind
    // utilities have silently failed at least once in this layout.
    const heightStyle = {
        height: CHART_HEIGHT,
        minHeight: CHART_HEIGHT,
        maxHeight: CHART_HEIGHT
    } as const;

    const ghost = (
        <section className="flex w-full shrink-0 items-end overflow-hidden" style={heightStyle}>
            <MultichainAssetChartGhost className="h-[165px] w-full" />
        </section>
    );

    // Checked before the data: `keepPreviousData` leaves the previous
    // period's points in `data` when the new period's request fails, and
    // drawing those under the new period label would be a wrong chart.
    if (isError) {
        if (isFetching) return ghost;
        return (
            <section
                className="flex w-full shrink-0 flex-col items-center justify-center gap-4 overflow-hidden px-8"
                style={heightStyle}
            >
                <ChartNoDataWave className="h-4 w-[119px] text-textTertiary" />
                <span className="text-body1 text-textSecondary">
                    {t('wallet_asset_chart_error')}
                </span>
                <Button
                    variant="secondary"
                    size="small"
                    leftIcon={<IcRefresh16 className="size-4" />}
                    onClick={() => refetch()}
                >
                    {t('retry')}
                </Button>
            </section>
        );
    }

    if (!data || points.length === 0) {
        if (isFetching) return ghost;
        return (
            <section
                className="flex w-full shrink-0 flex-col items-center justify-center gap-7 overflow-hidden px-8"
                style={heightStyle}
            >
                <ChartNoDataWave className="h-4 w-[119px] text-textTertiary" />
                <span className="text-body1 text-textSecondary">
                    {t('wallet_asset_chart_unavailable')}
                </span>
            </section>
        );
    }

    // The min / max labels sit in their own rows above and below the plot,
    // so the line can never run underneath them.
    const priceLabelStyle = { height: PRICE_LABEL_HEIGHT } as const;

    return (
        <section
            className="flex w-full shrink-0 touch-pan-y flex-col overflow-hidden"
            style={heightStyle}
            onTouchEnd={handleEnd}
            onTouchCancel={handleEnd}
        >
            <div
                className="flex shrink-0 items-start justify-end px-4 text-body3 text-textSecondary"
                style={priceLabelStyle}
            >
                {maxPrice !== undefined && formatFiatCurrency(fiat, maxPrice)}
            </div>
            <div ref={ref} className="w-full" style={{ height: PLOT_HEIGHT }}>
                {width > 0 && (
                    <AreaChart
                        width={width}
                        height={PLOT_HEIGHT}
                        data={points}
                        margin={{
                            top: PLOT_VERTICAL_INSET,
                            right: 16,
                            bottom: PLOT_VERTICAL_INSET,
                            left: 16
                        }}
                        onMouseMove={handleMove}
                        onMouseDown={handleMove}
                        onMouseLeave={handleEnd}
                    >
                        <defs>
                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="0%"
                                    style={{ stopColor: trendColor, stopOpacity: 0.4 }}
                                />
                                <stop
                                    offset="100%"
                                    style={{ stopColor: trendColor, stopOpacity: 0 }}
                                />
                            </linearGradient>
                        </defs>
                        <XAxis
                            hide
                            dataKey="timestamp"
                            type="number"
                            domain={['dataMin', 'dataMax']}
                            padding={{ left: 0, right: 0 }}
                        />
                        <YAxis hide width={0} domain={['dataMin', 'dataMax']} />
                        {/* No tooltip box — the Tooltip is mounted only so Recharts
                        tracks the active point and draws the crosshair + dot. */}
                        <Tooltip
                            content={() => null}
                            active={scrubbing}
                            cursor={{
                                stroke: 'var(--tk-text-primary)',
                                strokeDasharray: '4 4'
                            }}
                            isAnimationActive={false}
                        />
                        <Area
                            type="monotone"
                            dataKey="price"
                            stroke={trendColor}
                            strokeWidth={1.5}
                            fill="url(#chartGradient)"
                            isAnimationActive={false}
                            activeDot={
                                scrubbing
                                    ? {
                                          r: 4,
                                          fill: 'var(--tk-text-primary)',
                                          stroke: 'rgba(255, 255, 255, 0.16)',
                                          strokeWidth: 8
                                      }
                                    : false
                            }
                        />
                    </AreaChart>
                )}
            </div>
            <div
                className="flex shrink-0 items-end justify-end px-4 text-body3 text-textSecondary"
                style={priceLabelStyle}
            >
                {minPrice !== undefined && formatFiatCurrency(fiat, minPrice)}
            </div>
        </section>
    );
});
